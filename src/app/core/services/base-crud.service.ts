import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TenantService } from './tenant.service';

/**
 * Serviço base com operações CRUD genéricas via Supabase.
 * O id_empresa é injetado automaticamente em create() via TenantService,
 * com fallback direto ao banco caso o serviço ainda não esteja populado.
 */
export abstract class BaseCrudService<T> {
  protected abstract tableName: string;
  protected selectQuery = '*';

  private tenantService = inject(TenantService);

  constructor(protected supabaseService: SupabaseService) {}

  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .order('id', { ascending: false });
    if (error) throw error;
    return (data as unknown as T[]) || [];
  }

  async getById(id: number): Promise<T> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as T;
  }

  async create(item: Partial<T>): Promise<T> {
    const idEmpresa = await this.resolverIdEmpresa();
    const payload = idEmpresa ? { ...item, id_empresa: idEmpresa } : item;

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .insert(payload)
      .select(this.selectQuery)
      .single();
    if (error) throw error;
    return data as unknown as T;
  }

  async update(id: number, item: Partial<T>): Promise<T> {
    const payload = Object.fromEntries(
      Object.entries(item as object).filter(([, v]) => typeof v !== 'object' || v === null)
    );
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ ...payload, atualizacao: new Date().toISOString() })
      .eq('id', id)
      .select(this.selectQuery)
      .single();
    if (error) throw error;
    return data as unknown as T;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async softDelete(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ ativo: false, atualizacao: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  /**
   * Retorna o id_empresa do TenantService.
   * Se estiver nulo (ex: app recém-aberto, race condition no login),
   * busca diretamente da tabela usuario e atualiza o TenantService.
   */
  private async resolverIdEmpresa(): Promise<string | null> {
    if (this.tenantService.idEmpresa) {
      return this.tenantService.idEmpresa;
    }

    // Fallback: busca direto do banco
    const { data: { user } } = await this.supabaseService.auth.getUser();
    if (!user) return null;

    const { data } = await this.supabaseService.client
      .from('usuario')
      .select('id_empresa')
      .eq('id', user.id)
      .maybeSingle();

    const idEmpresa = data?.id_empresa ?? null;

    // Atualiza o TenantService para as próximas chamadas
    if (idEmpresa) {
      this.tenantService.setIdEmpresa(idEmpresa);
    }

    return idEmpresa;
  }
}
