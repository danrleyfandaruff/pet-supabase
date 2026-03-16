import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Caixa } from '../models/caixa.model';

@Injectable({ providedIn: 'root' })
export class CaixaService extends BaseCrudService<Caixa> {
  protected override tableName = 'caixa';
  protected override selectQuery = '*';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  /** Remove o lançamento vinculado a um atendimento específico */
  async deleteByAtendimento(idAtendimento: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .delete()
      .eq('id_atendimento', idAtendimento);
    if (error) throw error;
  }

  /** Total de entradas do mês atual */
  async getTotalMesAtual(): Promise<number> {
    const hoje = new Date();
    const inicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('valor')
      .eq('tipo', 'entrada')
      .gte('data', inicio);
    if (error) throw error;
    return (data as any[]).reduce((sum, r) => sum + Number(r.valor), 0);
  }

  /** Entradas e saídas agrupadas por mês (últimos N meses) */
  async getMensal(meses = 6): Promise<{ mes: string; entradas: number; saidas: number }[]> {
    const resultado: { mes: string; entradas: number; saidas: number }[] = [];
    const hoje = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const inicio = `${ano}-${mes}-01`;
      // primeiro dia do mês seguinte (evita datas inválidas como 31/11)
      const proximoMes = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const fimExclusivo = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .select('tipo, valor')
        .gte('data', inicio)
        .lt('data', fimExclusivo);

      if (error) throw error;
      const registros = (data as any[]) || [];
      resultado.push({
        mes: `${mes}/${String(ano).slice(2)}`,
        entradas: registros.filter(r => r.tipo === 'entrada').reduce((s, r) => s + Number(r.valor), 0),
        saidas:   registros.filter(r => r.tipo === 'saida').reduce((s, r) => s + Number(r.valor), 0),
      });
    }
    return resultado;
  }

  /** Registros de caixa em um período (YYYY-MM-DD) */
  async getByPeriodo(inicio: string, fim: string): Promise<Caixa[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true });
    if (error) throw error;
    return (data as unknown as Caixa[]) || [];
  }

  /** Retorna todos os registros ordenados pela data decrescente */
  async getAllOrdenado(): Promise<Caixa[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .order('data', { ascending: false });
    if (error) throw error;
    return (data as unknown as Caixa[]) || [];
  }
}
