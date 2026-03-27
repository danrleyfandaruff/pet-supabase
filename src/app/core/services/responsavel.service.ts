import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Responsavel } from '../models/responsavel.model';

@Injectable({ providedIn: 'root' })
export class ResponsavelService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Responsavel[]> {
    return lastValueFrom(this.api.getResponsaveis());
  }

  async getAllAtivos(): Promise<Responsavel[]> {
    return lastValueFrom(this.api.getResponsaveisAtivos());
  }

  async getById(id: number): Promise<Responsavel> {
    return lastValueFrom(this.api.getResponsavelById(id));
  }

  async create(item: Partial<Responsavel>): Promise<any> {
    return lastValueFrom(this.api.cadastrarResponsavel(item));
  }

  async update(id: number, item: Partial<Responsavel>): Promise<any> {
    return lastValueFrom(this.api.atualizarResponsavel(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarResponsavel(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarResponsavel(id));
  }
}
