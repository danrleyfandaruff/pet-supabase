import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Cliente } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService extends BaseCrudService<Cliente> {
  protected tableName = 'cliente';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async getAllAtivos(): Promise<Cliente[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return (data as Cliente[]) || [];
  }
}
