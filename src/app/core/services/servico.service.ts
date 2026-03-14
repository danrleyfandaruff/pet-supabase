import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicoService extends BaseCrudService<Servico> {
  protected override tableName = 'servico';
  protected override selectQuery = '*, tipo_servico(nome)';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async getAllAtivos(): Promise<Servico[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return (data as unknown as Servico[]) || [];
  }
}
