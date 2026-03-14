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
 * Injeta automaticamente o token JWT do Supabase em todas as requisições HTTP
 * e redireciona para login em caso de 401 (token expirado ou inválido).
 *
 * Nota: chamadas diretas ao Supabase (via SupabaseService) já são autenticadas
 * pelo cliente Supabase internamente — este interceptor serve para outras APIs REST
 * que você possa vir a consumir.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Ignora requisições para a própria API do Supabase (já autenticadas pelo cliente)
    if (request.url.includes('supabase.co')) {
      return next.handle(request);
    }

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
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
