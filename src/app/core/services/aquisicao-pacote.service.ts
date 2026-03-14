import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { AquisicaoPacote } from '../models/aquisicao-pacote.model';

@Injectable({ providedIn: 'root' })
export class AquisicaoPacoteService extends BaseCrudService<AquisicaoPacote> {
  protected override tableName = 'aquisicao_pacote';
  protected override selectQuery = '*, pacote(nome), animal(nome)';

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
}
