import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Atendimento } from '../models/atendimento.model';

@Injectable({ providedIn: 'root' })
export class AtendimentoService extends BaseCrudService<Atendimento> {
  protected override tableName = 'atendimento';
  protected override selectQuery = `
    *,
    cliente(nome),
    animal(nome, id_cliente),
    responsavel(nome),
    status_info:status(nome),
    servico!atendimento_id_servico_fkey(nome, valor),
    pacote!atendimento_id_pacote_fkey(nome)
  `;

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  /** Atendimentos de hoje */
  async getHoje(): Promise<Atendimento[]> {
    const hoje = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('data', hoje)
      .order('data', { ascending: true });
    if (error) throw error;
    return (data as unknown as Atendimento[]) || [];
  }

  /** Quantidade de atendimentos não pagos */
  async countPendentes(): Promise<number> {
    const { count, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('pago', false);
    if (error) throw error;
    return count ?? 0;
  }

  /** Todos os atendimentos de um animal específico */
  async getByAnimal(idAnimal: number): Promise<Atendimento[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id_animal', idAnimal)
      .order('data', { ascending: false });
    if (error) throw error;
    return (data as unknown as Atendimento[]) || [];
  }

  async marcarPago(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ pago: true })
      .eq('id', id);
    if (error) throw error;
  }

  async desmarcarPago(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ pago: false })
      .eq('id', id);
    if (error) throw error;
  }

  /** Todos os atendimentos de um cliente específico */
  async getByCliente(idCliente: number): Promise<Atendimento[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id_cliente', idCliente)
      .order('data', { ascending: false });
    if (error) throw error;
    return (data as unknown as Atendimento[]) || [];
  }

  /** Atendimentos em um período (YYYY-MM-DD) */
  async getByPeriodo(inicio: string, fim: string): Promise<Atendimento[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true });
    if (error) throw error;
    return (data as unknown as Atendimento[]) || [];
  }

  override async update(id: number, item: Partial<Atendimento>): Promise<Atendimento> {
    const payload = Object.fromEntries(
      Object.entries(item as object).filter(([, v]) => typeof v !== 'object' || v === null)
    );
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select(this.selectQuery)
      .single();
    if (error) throw error;
    return data as unknown as Atendimento;
  }
}
