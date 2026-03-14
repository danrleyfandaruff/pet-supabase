import { Injectable } from '@angular/core';

/**
 * Serviço singleton que armazena o id_empresa do usuário logado.
 * É preenchido pelo AuthService após login/restore de sessão e
 * consumido pelo BaseCrudService para injetar id_empresa automaticamente.
 */
@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private _idEmpresa: string | null = null;

  setIdEmpresa(id: string | null): void {
    this._idEmpresa = id;
  }

  get idEmpresa(): string | null {
    return this._idEmpresa;
  }
}
