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

  /** Operação atômica: valida, marca como pago e cria entrada no caixa. */
  async darBaixa(id: number, dto: { forma_pagamento: string; descricao?: string; data?: string }): Promise<{ mensagem: string; id_caixa: number }> {
    return lastValueFrom(this.api.darBaixaAtendimento(id, dto));
  }

  /** Operação atômica: remove lançamento do caixa e desmarca pagamento. */
  async desfazerBaixa(id: number): Promise<string> {
    return lastValueFrom(this.api.desfazerBaixaAtendimento(id));
  }

  /** Dá baixa em vários atendimentos de uma vez. */
  async darBaixaLote(itens: { id: number; forma_pagamento: string; descricao?: string }[]): Promise<{ sucesso: number; erros: { id: number; motivo: string }[] }> {
    return lastValueFrom(this.api.darBaixaAtendimentoLote(itens));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarAtendimento(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarAtendimento(id));
  }
}
