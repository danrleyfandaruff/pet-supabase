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
