import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicoService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Servico[]> {
    return lastValueFrom(this.api.getServicos());
  }

  async getAllAtivos(): Promise<Servico[]> {
    return lastValueFrom(this.api.getServicosAtivos());
  }

  async getById(id: number): Promise<Servico> {
    return lastValueFrom(this.api.getServicoById(id));
  }

  async create(item: Partial<Servico>): Promise<any> {
    return lastValueFrom(this.api.cadastrarServico(item));
  }

  async update(id: number, item: Partial<Servico>): Promise<any> {
    return lastValueFrom(this.api.atualizarServico(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarServico(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarServico(id));
  }
}
