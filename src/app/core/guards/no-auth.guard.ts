import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Guard para rotas públicas: redireciona para home se já estiver logado
@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isReady$.pipe(
      filter((ready) => ready),
      take(1),
      switchMap(() => this.authService.isAuthenticated$.pipe(take(1))),
      map((isAuthenticated) => {
        if (!isAuthenticated) {
          return true;
        }
        return this.router.createUrlTree(['/home']);
      })
    );
  }
}
