import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { PermissaoService, Permissao } from '../services/permissao.service';

/**
 * Guard de permissão por rota.
 *
 * Uso no router:
 *   {
 *     path: 'caixa',
 *     canActivate: [RoleGuard],
 *     data: { permissao: 'ver_caixa' },
 *     loadChildren: ...
 *   }
 *
 * Se o usuário não tiver a permissão, é redirecionado para /tabs/inicio.
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private permissaoService: PermissaoService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const permissao = route.data['permissao'] as Permissao | undefined;

    if (!permissao || this.permissaoService.pode(permissao)) {
      return true;
    }

    this.router.navigate(['/tabs/inicio'], { replaceUrl: true });
    return false;
  }
}
