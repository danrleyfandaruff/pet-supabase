import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Pacote } from '../models/pacote.model';

@Injectable({ providedIn: 'root' })
export class PacoteService extends BaseCrudService<Pacote> {
  protected tableName = 'pacote';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async getAllAtivos(): Promise<Pacote[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return (data as Pacote[]) || [];
  }
}
