import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Singleton que expõe o cliente Supabase para toda a aplicação.
 * Injete este serviço onde precisar acessar banco de dados, storage ou auth diretamente.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      environment.supabase.url,
      environment.supabase.key,
      {
        auth: {
          // Persiste a sessão automaticamente no localStorage
          persistSession: true,
          // Atualiza o token automaticamente antes de expirar
          autoRefreshToken: true,
          // Detecta sessões na URL (para magic links e OAuth)
          detectSessionInUrl: true,
        },
      }
    );
  }

  /** Acesso ao cliente Supabase completo */
  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  /** Atalho para o módulo de autenticação */
  get auth() {
    return this.supabaseClient.auth;
  }
}
