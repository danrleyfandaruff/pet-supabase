import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { PerfilUsuario } from '../models/user.model';

/**
 * Permissões disponíveis no sistema.
 * Cada chave representa uma capacidade que pode ser concedida ou negada por perfil.
 */
export type Permissao =
  | 'ver_caixa'
  | 'ver_relatorios'
  | 'ver_valores'
  | 'ver_configuracoes'
  | 'ver_clientes'
  | 'cadastrar';

/**
 * Matriz de permissões por perfil.
 * - admin     → acesso total
 * - atendente → sem financeiro (caixa, relatórios, valores)
 * - tosador   → apenas atendimentos e pets, sem cadastros nem financeiro
 */
const MATRIZ: Record<PerfilUsuario, Record<Permissao, boolean>> = {
  admin: {
    ver_caixa:          true,
    ver_relatorios:     true,
    ver_valores:        true,
    ver_configuracoes:  true,
    ver_clientes:       true,
    cadastrar:          true,
  },
  atendente: {
    ver_caixa:          false,
    ver_relatorios:     false,
    ver_valores:        false,
    ver_configuracoes:  true,
    ver_clientes:       true,
    cadastrar:          true,
  },
  tosador: {
    ver_caixa:          false,
    ver_relatorios:     false,
    ver_valores:        false,
    ver_configuracoes:  true,   // precisa acessar para poder deslogar
    ver_clientes:       false,
    cadastrar:          false,
  },
};

@Injectable({ providedIn: 'root' })
export class PermissaoService {
  constructor(private authService: AuthService) {}

  /** Verifica sincronamente se o usuário atual tem a permissão. */
  pode(permissao: Permissao): boolean {
    const perfil = this.authService.currentUser?.perfil ?? 'admin';
    return MATRIZ[perfil]?.[permissao] ?? false;
  }

  /** Observable que emite sempre que o usuário muda (ex.: logout/login). */
  pode$(permissao: Permissao): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        const perfil = user?.perfil ?? 'admin';
        return MATRIZ[perfil]?.[permissao] ?? false;
      }),
    );
  }

  /** Retorna o perfil atual. */
  get perfil(): PerfilUsuario {
    return this.authService.currentUser?.perfil ?? 'admin';
  }
}
