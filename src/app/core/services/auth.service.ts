import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { filter, map, catchError, switchMap } from 'rxjs/operators';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Estado global reativo
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  /** Emite `true` uma única vez, quando initSession() termina. Guards usam isso para não agir antes da sessão ser restaurada. */
  private isReadySubject = new BehaviorSubject<boolean>(false);

  // Observables públicos para componentes assinarem
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  public isReady$: Observable<boolean> = this.isReadySubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private tenantService: TenantService
  ) {
    this.initSession();
    this.listenToAuthChanges();
  }

  // Getter síncrono do usuário atual
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Getter síncrono do estado de autenticação
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Restaura sessão existente ao iniciar o app.
   */
  private async initSession(): Promise<void> {
    const { data } = await this.supabaseService.auth.getSession();
    if (data.session) {
      await this.updateState(data.session);
    }
    // Sinaliza que a verificação de sessão terminou —
    // a partir daqui os guards podem checar isAuthenticated$ com segurança.
    this.isReadySubject.next(true);
  }

  /**
   * Escuta mudanças de estado da autenticação.
   */
  private listenToAuthChanges(): void {
    this.supabaseService.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          if (session) {
            this.updateState(session);
          }
        } else if (event === 'SIGNED_OUT') {
          this.clearState();
        }
      }
    );
  }

  /**
   * Realiza login com e-mail e senha.
   */
  login(credentials: LoginRequest): Observable<void> {
    this.isLoadingSubject.next(true);

    return from(
      this.supabaseService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
    ).pipe(
      switchMap(async ({ data, error }) => {
        this.isLoadingSubject.next(false);
        if (error) throw new Error(this.translateError(error.message));
        if (data.session) await this.updateState(data.session);
      }),
      catchError((err) => {
        this.isLoadingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Registra novo usuário.
   * A criação de empresa + usuario é feita automaticamente via trigger no Supabase
   * (função handle_new_user), usando os metadados passados no signUp.
   */
  register(data: RegisterRequest): Observable<void> {
    this.isLoadingSubject.next(true);

    return from(
      this.supabaseService.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // nomeEmpresa e name são lidos pelo trigger handle_new_user no Supabase
          data: {
            name: data.name,
            nomeEmpresa: data.nomeEmpresa,
          },
        },
      })
    ).pipe(
      switchMap(async ({ data: authData, error }) => {
        if (error) throw new Error(this.translateError(error.message));
        if (!authData.user) throw new Error('Erro ao criar usuário. Tente novamente.');

        // O trigger já criou empresa + usuario. Atualiza estado se há sessão.
        if (authData.session) await this.updateState(authData.session);

        this.isLoadingSubject.next(false);
      }),
      catchError((err) => {
        this.isLoadingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Realiza logout e limpa o estado.
   */
  logout(): Observable<void> {
    return from(this.supabaseService.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) console.warn('Erro no logout:', error.message);
        this.clearState();
      })
    );
  }

  /**
   * Retorna o token JWT da sessão atual (para o interceptor HTTP).
   */
  async getToken(): Promise<string | null> {
    const { data } = await this.supabaseService.auth.getSession();
    return data.session?.access_token ?? null;
  }

  /**
   * Atualiza o estado com os dados da sessão e carrega id_empresa do DB.
   */
  private async updateState(session: Session): Promise<void> {
    const supabaseUser = session.user;

    // Busca id_empresa do usuário. Tenta até 3 vezes com delay,
    // pois o trigger pode demorar alguns ms para commitar após o signUp.
    let idEmpresa: string | null = null;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      if (tentativa > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      const { data: usuarioData, error: usuarioError } = await this.supabaseService.client
        .from('usuario')
        .select('id_empresa')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (usuarioError) {
        console.warn(`Tentativa ${tentativa + 1} — erro ao carregar usuario:`, usuarioError.message);
        continue;
      }
      if (usuarioData?.id_empresa) {
        idEmpresa = usuarioData.id_empresa;
        break;
      }
    }
    if (!idEmpresa) {
      console.warn('id_empresa não encontrado após 3 tentativas.');
    }

    // Salva no TenantService para uso global
    this.tenantService.setIdEmpresa(idEmpresa);

    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name: supabaseUser.user_metadata?.['name'] ?? supabaseUser.email ?? '',
      id_empresa: idEmpresa ?? undefined,
      createdAt: supabaseUser.created_at,
    };
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  // Limpa o estado ao sair
  private clearState(): void {
    this.tenantService.setIdEmpresa(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Traduz mensagens de erro do Supabase para português
  private translateError(message: string): string {
    const errors: Record<string, string> = {
      'Invalid login credentials': 'E-mail ou senha inválidos.',
      'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
      'User already registered': 'Este e-mail já está cadastrado.',
      'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
      'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
      'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
      'over_email_send_rate_limit': 'Muitas tentativas. Aguarde alguns minutos.',
      'signup_disabled': 'Cadastro desativado. Contate o suporte.',
    };
    return errors[message] ?? message;
  }
}
