import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { TipoServico } from '../models/tipo-servico.model';

@Injectable({ providedIn: 'root' })
export class TipoServicoService extends BaseCrudService<TipoServico> {
  protected tableName = 'tipo_servico';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  // tipo_servico não tem campo 'atualizacao'
  override async update(id: number, item: Partial<TipoServico>): Promise<TipoServico> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TipoServico;
  }
}
