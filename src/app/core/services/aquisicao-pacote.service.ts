import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { AquisicaoPacote } from '../models/aquisicao-pacote.model';

@Injectable({ providedIn: 'root' })
export class AquisicaoPacoteService extends BaseCrudService<AquisicaoPacote> {
  protected override tableName = 'aquisicao_pacote';
  protected override selectQuery = `
    *,
    pacote(nome, quantidade, recorrencia),
    animal(nome),
    atendimento(id, data, pago, status_info:status(nome))
  `;

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  // aquisicao_pacote não tem campo 'atualizacao'
  override async update(id: number, item: Partial<AquisicaoPacote>): Promise<AquisicaoPacote> {
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
    return data as unknown as AquisicaoPacote;
  }

  /** Planos de um animal específico */
  async getByAnimal(idAnimal: number): Promise<AquisicaoPacote[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id_animal', idAnimal)
      .order('data_aquisicao', { ascending: false });
    if (error) throw error;
    return (data as unknown as AquisicaoPacote[]) || [];
  }

  /** Cancela um plano: exclui todos os atendimentos vinculados e depois o plano */
  async cancelarPlano(aquisicaoId: number, atendimentoIds: number[]): Promise<void> {
    if (atendimentoIds.length > 0) {
      const { error: errAts } = await this.supabaseService.client
        .from('atendimento')
        .delete()
        .in('id', atendimentoIds);
      if (errAts) throw errAts;
    }
    await this.delete(aquisicaoId);
  }
}
