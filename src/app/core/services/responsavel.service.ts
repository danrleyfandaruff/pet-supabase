import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Responsavel } from '../models/responsavel.model';

@Injectable({ providedIn: 'root' })
export class ResponsavelService extends BaseCrudService<Responsavel> {
  protected tableName = 'responsavel';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async getAllAtivos(): Promise<Responsavel[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return (data as Responsavel[]) || [];
  }
}
