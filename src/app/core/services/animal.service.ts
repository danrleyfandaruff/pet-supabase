import { Injectable } from '@angular/core';
import { BaseCrudService } from './base-crud.service';
import { SupabaseService } from './supabase.service';
import { Animal } from '../models/animal.model';

@Injectable({ providedIn: 'root' })
export class AnimalService extends BaseCrudService<Animal> {
  protected override tableName = 'animal';
  protected override selectQuery = '*, cliente(nome), raca(nome)';

  constructor(supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async getByCliente(idCliente: number): Promise<Animal[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id_cliente', idCliente)
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return (data as unknown as Animal[]) || [];
  }
}
