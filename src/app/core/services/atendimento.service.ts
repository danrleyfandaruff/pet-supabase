import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Atendimento } from '../models/atendimento.model';

@Injectable({ providedIn: 'root' })
export class AtendimentoService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Atendimento[]> {
    return lastValueFrom(this.api.getAtendimentos());
  }

  async getById(id: number): Promise<Atendimento> {
    return lastValueFrom(this.api.getAtendimentoById(id));
  }

  async getHoje(): Promise<Atendimento[]> {
    return lastValueFrom(this.api.getAtendimentosHoje());
  }

  async countPendentes(): Promise<number> {
    const res = await lastValueFrom(this.api.countAtendimentosPendentes());
    return res.count;
  }

  async getByAnimal(idAnimal: number): Promise<Atendimento[]> {
    return lastValueFrom(this.api.getAtendimentosPorAnimal(idAnimal));
  }

  async getByCliente(idCliente: number): Promise<Atendimento[]> {
    return lastValueFrom(this.api.getAtendimentosPorCliente(idCliente));
  }

  async getByPeriodo(inicio: string, fim: string): Promise<Atendimento[]> {
    return lastValueFrom(this.api.getAtendimentosPorPeriodo(inicio, fim));
  }

  async create(item: Partial<Atendimento>): Promise<any> {
    return lastValueFrom(this.api.cadastrarAtendimento(item));
  }

  async update(id: number, item: Partial<Atendimento>): Promise<any> {
    return lastValueFrom(this.api.atualizarAtendimento(id, item));
  }

  async marcarPago(id: number): Promise<any> {
    return lastValueFrom(this.api.marcarAtendimentoPago(id));
  }

  async desmarcarPago(id: number): Promise<any> {
    return lastValueFrom(this.api.desmarcarAtendimentoPago(id));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarAtendimento(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarAtendimento(id));
  }
}
