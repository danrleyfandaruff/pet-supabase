import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const FRIENDLY_SERVER_ERROR = 'Não foi possível completar a operação. Tente novamente.';

/** Termos que indicam erro técnico de infraestrutura — nunca exibir ao usuário */
const TECHNICAL_PHRASES = [
  'internal server error',
  'bad gateway',
  'service unavailable',
  'gateway timeout',
  'network error',
  'cannot read propert',
  'typeerror',
  'stack trace',
  'at object.',
  'undefined is not',
  'null reference',
];

/**
 * Tenta extrair uma mensagem de negócio do corpo da resposta de erro.
 * Funciona para erros 4xx e também para 5xx quando o backend popula
 * o corpo com uma mensagem de regra de negócio (ex: conflito de horário).
 */
function friendlyMessage(error: HttpErrorResponse): string {
  // Sem conexão / CORS / timeout de rede
  if (error.status === 0) return 'Sem conexão com o servidor. Verifique sua internet.';

  // Extrai a mensagem do corpo da resposta
  const body = error.error;

  // O body pode chegar como string (quando o backend serializa direto)
  // ou como objeto { message, error, statusCode }
  let rawMsg = '';
  if (typeof body === 'string' && body.trim()) {
    rawMsg = body.trim();
  } else if (typeof body === 'object' && body !== null) {
    rawMsg =
      (typeof body.message === 'string' ? body.message : '') ||
      (typeof body.error === 'string' ? body.error : '') ||
      '';
  }

  // Se a mensagem parece técnica/stack-trace, descarta
  const lower = rawMsg.toLowerCase();
  if (TECHNICAL_PHRASES.some(t => lower.includes(t))) return FRIENDLY_SERVER_ERROR;

  // Mensagem de negócio presente → exibe ela (mesmo em 5xx)
  if (rawMsg && rawMsg.length < 300) return rawMsg;

  // Erros 4xx sem corpo útil — mensagem por código HTTP
  if (error.status === 400) return 'Dados inválidos. Verifique as informações e tente novamente.';
  if (error.status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (error.status === 404) return 'Registro não encontrado.';
  if (error.status === 409) return 'Conflito: este registro já existe ou está em uso.';
  if (error.status === 422) return 'Não foi possível processar os dados informados.';

  return FRIENDLY_SERVER_ERROR;
}

/**
 * Injeta automaticamente o token JWT em todas as requisições HTTP ao NestJS
 * e redireciona para login em caso de 401 (token expirado ou inválido).
 * Também converte erros HTTP em mensagens amigáveis ao usuário.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return from(this.authService.getToken()).pipe(
      switchMap((token) => {
        if (token) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
        return next.handle(request);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Limpa o estado local e redireciona sem chamar o servidor
          // (o token pode já estar inválido, evitando loop de logout)
          this.authService.clearLocalState();
          this.router.navigate(['/login'], { replaceUrl: true });
        } else if (error.status === 402) {
          // Assinatura expirada ou trial vencido → paywall
          this.router.navigate(['/assinatura'], { replaceUrl: true });
        }
        // Converte o erro HTTP em um Error JS com mensagem amigável,
        // para que qualquer catch nos componentes receba sempre texto legível.
        return throwError(() => new Error(friendlyMessage(error)));
      }),
    );
  }
}
