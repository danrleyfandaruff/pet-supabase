import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Pacote } from '../models/pacote.model';

@Injectable({ providedIn: 'root' })
export class PacoteService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Pacote[]> {
    return lastValueFrom(this.api.getPacotes());
  }

  async getAllAtivos(): Promise<Pacote[]> {
    return lastValueFrom(this.api.getPacotesAtivos());
  }

  async getById(id: number): Promise<Pacote> {
    return lastValueFrom(this.api.getPacoteById(id));
  }

  async create(item: Partial<Pacote>): Promise<any> {
    return lastValueFrom(this.api.cadastrarPacote(item));
  }

  async update(id: number, item: Partial<Pacote>): Promise<any> {
    return lastValueFrom(this.api.atualizarPacote(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarPacote(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarPacote(id));
  }
}
