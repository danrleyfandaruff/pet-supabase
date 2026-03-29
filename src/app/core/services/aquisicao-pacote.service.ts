import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AquisicaoPacote } from '../models/aquisicao-pacote.model';

@Injectable({ providedIn: 'root' })
export class AquisicaoPacoteService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<AquisicaoPacote[]> {
    return lastValueFrom(this.api.getAquisicoesPacote());
  }

  async getById(id: number): Promise<AquisicaoPacote> {
    return lastValueFrom(this.api.getAquisicaoPacoteById(id));
  }

  async getSessoes(id: number): Promise<any[]> {
    return lastValueFrom(this.api.getSessoesPorAquisicao(id));
  }

  async getByAnimal(idAnimal: number): Promise<AquisicaoPacote[]> {
    return lastValueFrom(this.api.getAquisicoesPorAnimal(idAnimal));
  }

  async create(item: Partial<AquisicaoPacote>): Promise<any> {
    return lastValueFrom(this.api.cadastrarAquisicaoPacote(item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarAquisicaoPacote(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarAquisicaoPacote(id));
  }

  async cancelarPlano(aquisicaoId: number, atendimentoIds: number[]): Promise<any> {
    return lastValueFrom(this.api.cancelarPlano(aquisicaoId, atendimentoIds));
  }
}
