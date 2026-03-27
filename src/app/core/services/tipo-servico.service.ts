import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { TipoServico } from '../models/tipo-servico.model';

@Injectable({ providedIn: 'root' })
export class TipoServicoService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<TipoServico[]> {
    return lastValueFrom(this.api.getTiposServico());
  }

  async getById(id: number): Promise<TipoServico> {
    return lastValueFrom(this.api.getTipoServicoById(id));
  }

  async create(item: Partial<TipoServico>): Promise<any> {
    return lastValueFrom(this.api.cadastrarTipoServico(item));
  }

  async update(id: number, item: Partial<TipoServico>): Promise<any> {
    return lastValueFrom(this.api.atualizarTipoServico(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarTipoServico(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarTipoServico(id));
  }
}
