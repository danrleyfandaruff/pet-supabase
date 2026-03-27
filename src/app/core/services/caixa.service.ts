import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Caixa } from '../models/caixa.model';

@Injectable({ providedIn: 'root' })
export class CaixaService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Caixa[]> {
    return lastValueFrom(this.api.getCaixa());
  }

  async getAllOrdenado(): Promise<Caixa[]> {
    return lastValueFrom(this.api.getCaixaOrdenado());
  }

  async getById(id: number): Promise<Caixa> {
    return lastValueFrom(this.api.getCaixaById(id));
  }

  async getTotalMesAtual(): Promise<number> {
    const res = await lastValueFrom(this.api.getTotalMesAtual());
    return res.total;
  }

  async getMensal(meses = 6): Promise<{ mes: string; entradas: number; saidas: number }[]> {
    return lastValueFrom(this.api.getCaixaMensal(meses));
  }

  async getByPeriodo(inicio: string, fim: string): Promise<Caixa[]> {
    return lastValueFrom(this.api.getCaixaPorPeriodo(inicio, fim));
  }

  async create(item: Partial<Caixa>): Promise<any> {
    return lastValueFrom(this.api.cadastrarCaixa(item));
  }

  async update(id: number, item: Partial<Caixa>): Promise<any> {
    return lastValueFrom(this.api.atualizarCaixa(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarCaixa(id));
  }

  async deleteByAtendimento(idAtendimento: number): Promise<any> {
    return lastValueFrom(this.api.deletarCaixaPorAtendimento(idAtendimento));
  }
}
