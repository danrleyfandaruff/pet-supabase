import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Raca } from '../models/raca.model';

@Injectable({ providedIn: 'root' })
export class RacaService extends BaseCrudService<Raca> {
  protected tableName = 'raca';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  // Raças não têm campo 'atualizacao', sobrescreve update sem esse campo
  override async update(id: number, item: Partial<Raca>): Promise<Raca> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Raca;
  }
}
