import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Espera initSession() terminar antes de verificar autenticação.
    // Sem isso, no refresh o guard lê isAuthenticated$ = false (valor inicial)
    // e redireciona pro login antes da sessão ser restaurada.
    return this.authService.isReady$.pipe(
      filter((ready) => ready),
      take(1),
      switchMap(() => this.authService.isAuthenticated$.pipe(take(1))),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}
