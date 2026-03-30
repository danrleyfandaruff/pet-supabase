import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { TenantService } from './tenant.service';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

/**
 * Serviço de autenticação — zero Supabase no frontend.
 * Toda a comunicação passa pelo NestJS:
 *   POST /auth/login    → login com e-mail e senha
 *   POST /auth/signup   → cadastro
 *   POST /auth/logout   → logout
 *   GET  /auth/me       → dados do usuário autenticado + id_empresa
 *   POST /auth/refresh  → renova o access_token
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject     = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isLoadingSubject       = new BehaviorSubject<boolean>(false);
  /** Emite true uma única vez quando initSession() termina — guards aguardam este sinal. */
  private isReadySubject         = new BehaviorSubject<boolean>(false);

  public currentUser$:     Observable<User | null> = this.currentUserSubject.asObservable();
  public isAuthenticated$: Observable<boolean>     = this.isAuthenticatedSubject.asObservable();
  public isLoading$:       Observable<boolean>     = this.isLoadingSubject.asObservable();
  public isReady$:         Observable<boolean>     = this.isReadySubject.asObservable();

  constructor(
    private tokenService: TokenService,
    private tenantService: TenantService,
    private apiService: ApiService,
  ) {
    this.initSession();
  }

  // ─── Getters síncronos ────────────────────────────────────────────────────

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // ─── Restauração de sessão ────────────────────────────────────────────────

  /**
   * Restaura a sessão ao iniciar o app.
   *
   * Estratégia em duas etapas:
   *  1. Restauração imediata — lê o cache local (sem rede). O guard é liberado
   *     logo após, evitando flicker de tela de login em cada refresh de página.
   *  2. Verificação em segundo plano — chama /auth/me para confirmar que o
   *     token ainda é válido e atualizar os dados do usuário. Se o token
   *     expirou, tenta renová-lo silenciosamente antes de verificar.
   */
  private async initSession(): Promise<void> {
    if (!this.tokenService.hasTokens()) {
      this.isReadySubject.next(true);
      return;
    }

    // ── Etapa 1: restauração imediata do cache ───────────────────────────
    const cached = this.tokenService.getUserCache();
    if (cached) {
      this.setUser(cached);          // isAuthenticated = true imediatamente
      this.isReadySubject.next(true); // guard liberado, sem esperar rede
      this.verificarTokenEmBackground();
      return;
    }

    // ── Etapa 2: sem cache — precisa bater na rede para obter os dados ───
    // (só acontece no primeiro uso após login, antes do cache ser populado)
    await this.restaurarSessaoViaRede();
    this.isReadySubject.next(true);
  }

  /**
   * Verifica em segundo plano se o token ainda é válido.
   * Não bloqueia a navegação — falhas silenciosas são toleradas.
   */
  private verificarTokenEmBackground(): void {
    // Usa setTimeout para não bloquear o ciclo atual do Angular
    setTimeout(async () => {
      try {
        if (this.tokenService.isTokenExpired()) {
          const renewed = await this.tentarRenovarToken();
          if (!renewed) { this.clearLocalState(); return; }
        }
        const meData = await lastValueFrom(this.apiService.me());
        // Atualiza cache e estado com dados frescos
        this.tokenService.saveUserCache(meData);
        this.setUser(meData);
      } catch (err: any) {
        // 401 = token genuinamente inválido → logout
        // Erros de rede (status 0) → mantém a sessão local, tenta na próxima vez
        if (err?.status === 401) {
          this.clearLocalState();
        }
      }
    }, 0);
  }

  /**
   * Restaura a sessão via rede quando não há cache local.
   * Tenta renovar o token se estiver expirado.
   */
  private async restaurarSessaoViaRede(): Promise<void> {
    try {
      if (this.tokenService.isTokenExpired()) {
        const renewed = await this.tentarRenovarToken();
        if (!renewed) return;
      }
      const meData = await lastValueFrom(this.apiService.me());
      this.tokenService.saveUserCache(meData);
      this.setUser(meData);
    } catch (err: any) {
      if (err?.status === 401) {
        // Token inválido definitivamente — limpa tudo
        this.clearLocalState();
      }
      // Erros de rede: não limpa tokens (usuário tenta novamente depois)
    }
  }

  /**
   * Renova o access_token via /auth/refresh.
   * Retorna true em caso de sucesso, false caso contrário.
   * Nota: /auth/refresh é @Public() no NestJS — não requer token válido.
   */
  private async tentarRenovarToken(): Promise<boolean> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const tokens = await lastValueFrom(this.apiService.refresh(refreshToken));
      this.tokenService.saveTokens(
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_at,
      );
      return true;
    } catch {
      this.tokenService.clearTokens();
      return false;
    }
  }

  // ─── Login / Cadastro / Logout ────────────────────────────────────────────

  /**
   * Realiza login com e-mail e senha via NestJS.
   */
  login(credentials: LoginRequest): Observable<void> {
    this.isLoadingSubject.next(true);

    return this.apiService.login(credentials.email, credentials.password).pipe(
      switchMap(async (response: any) => {
        this.isLoadingSubject.next(false);
        if (!response?.session) throw new Error('Resposta inválida do servidor.');

        this.tokenService.saveTokens(
          response.session.access_token,
          response.session.refresh_token,
          response.session.expires_at,
        );

        const meData = await lastValueFrom(this.apiService.me());
        this.tokenService.saveUserCache(meData);
        this.setUser(meData);
      }),
      catchError((err) => {
        this.isLoadingSubject.next(false);
        const msg = err?.error?.message || err?.message || 'Erro ao entrar.';
        return throwError(() => new Error(this.translateError(msg)));
      }),
    );
  }

  /**
   * Registra novo usuário via NestJS.
   * O NestJS faz o signUp no Supabase e dispara o seed de dados padrão.
   */
  register(data: RegisterRequest): Observable<void> {
    this.isLoadingSubject.next(true);

    return this.apiService.signup(data.email, data.password, { name: data.name, nomeEmpresa: data.nomeEmpresa }).pipe(
      switchMap(async (response: any) => {
        this.isLoadingSubject.next(false);
        if (!response?.user) throw new Error('Erro ao criar usuário. Tente novamente.');

        // Se a confirmação de e-mail estiver desabilitada, session vem preenchida.
        if (response.session) {
          this.tokenService.saveTokens(
            response.session.access_token,
            response.session.refresh_token,
            response.session.expires_at,
          );
          const meData = await lastValueFrom(this.apiService.me());
          this.tokenService.saveUserCache(meData);
          this.setUser(meData);
        }
      }),
      catchError((err) => {
        this.isLoadingSubject.next(false);
        const msg = err?.error?.message || err?.message || 'Erro ao criar conta.';
        return throwError(() => new Error(this.translateError(msg)));
      }),
    );
  }

  /**
   * Realiza logout — limpa o estado local e notifica o backend (best-effort).
   */
  logout(): Observable<void> {
    // Limpa o estado local imediatamente, independente da resposta do servidor
    this.clearLocalState();

    return this.apiService.logout().pipe(
      map(() => undefined as void),
      catchError(() => of(undefined as void)), // Ignora falhas de rede no logout
    );
  }

  // ─── Token para o interceptor HTTP ───────────────────────────────────────

  /**
   * Retorna o access_token armazenado.
   * O interceptor usa este método para injetar o Bearer token nas requisições.
   */
  async getToken(): Promise<string | null> {
    return this.tokenService.getAccessToken();
  }

  // ─── Estado interno ───────────────────────────────────────────────────────

  private setUser(meData: { id: string; email: string; name: string; id_empresa: string | null; perfil?: string; created_at: string }): void {
    this.tenantService.setIdEmpresa(meData.id_empresa);

    const user: User = {
      id:         meData.id,
      email:      meData.email,
      name:       meData.name,
      id_empresa: meData.id_empresa ?? undefined,
      perfil:     (meData.perfil as User['perfil']) ?? 'admin',
      createdAt:  meData.created_at,
    };

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Limpa tokens e estado reativo — usado pelo logout e pelo interceptor no 401.
   */
  clearLocalState(): void {
    this.tokenService.clearTokens();
    this.tenantService.setIdEmpresa(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // ─── Tradução de erros ────────────────────────────────────────────────────

  private translateError(message: string): string {
    const errors: Record<string, string> = {
      'Invalid login credentials':                          'E-mail ou senha inválidos.',
      'Email not confirmed':                                'Confirme seu e-mail antes de entrar.',
      'User already registered':                            'Este e-mail já está cadastrado.',
      'Password should be at least 6 characters':           'A senha deve ter ao menos 6 caracteres.',
      'Unable to validate email address: invalid format':   'Formato de e-mail inválido.',
      'Email rate limit exceeded':                          'Muitas tentativas. Aguarde alguns minutos.',
      'over_email_send_rate_limit':                         'Muitas tentativas. Aguarde alguns minutos.',
      'signup_disabled':                                    'Cadastro desativado. Contate o suporte.',
    };
    return errors[message] ?? message;
  }
}
