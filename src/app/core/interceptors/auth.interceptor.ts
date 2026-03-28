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

/**
 * Injeta automaticamente o token JWT em todas as requisições HTTP ao NestJS
 * e redireciona para login em caso de 401 (token expirado ou inválido).
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
        return throwError(() => error);
      }),
    );
  }
}
