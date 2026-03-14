import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Status } from '../models/status.model';

@Injectable({ providedIn: 'root' })
export class StatusService extends BaseCrudService<Status> {
  protected tableName = 'status';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  // Status não tem campo 'atualizacao'
  override async update(id: number, item: Partial<Status>): Promise<Status> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Status;
  }
}
