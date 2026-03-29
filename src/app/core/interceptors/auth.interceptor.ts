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

const FRIENDLY_SERVER_ERROR = 'Sistema indisponível no momento, tente novamente mais tarde';

const TECHNICAL_MESSAGES = [
  'internal server error',
  'bad gateway',
  'service unavailable',
  'gateway timeout',
  'network error',
];

function friendlyMessage(error: HttpErrorResponse): string {
  // Erros 5xx são sempre mensagem genérica
  if (error.status >= 500 || error.status === 0) return FRIENDLY_SERVER_ERROR;

  // Extrai mensagem do corpo da resposta
  const body = error.error;
  const msg: string =
    (typeof body?.message === 'string' && body.message) ||
    (typeof body?.error === 'string' && body.error) ||
    error.message ||
    '';

  if (TECHNICAL_MESSAGES.some(t => msg.toLowerCase().includes(t))) return FRIENDLY_SERVER_ERROR;

  return msg || FRIENDLY_SERVER_ERROR;
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
        }
        // Converte o erro HTTP em um Error JS com mensagem amigável,
        // para que qualquer catch nos componentes receba sempre texto legível.
        return throwError(() => new Error(friendlyMessage(error)));
      }),
    );
  }
}
