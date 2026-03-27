import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Raca } from '../models/raca.model';

@Injectable({ providedIn: 'root' })
export class RacaService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Raca[]> {
    return lastValueFrom(this.api.getRacas());
  }

  async getById(id: number): Promise<Raca> {
    return lastValueFrom(this.api.getRacaById(id));
  }

  async create(item: Partial<Raca>): Promise<any> {
    return lastValueFrom(this.api.cadastrarRaca(item));
  }

  async update(id: number, item: Partial<Raca>): Promise<any> {
    return lastValueFrom(this.api.atualizarRaca(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarRaca(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarRaca(id));
  }
}
