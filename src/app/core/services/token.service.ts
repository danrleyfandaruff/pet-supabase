import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY  = 'gl360_access_token';
const REFRESH_TOKEN_KEY = 'gl360_refresh_token';
const EXPIRES_AT_KEY    = 'gl360_expires_at';

/**
 * Gerencia o armazenamento e recuperação dos tokens JWT no localStorage.
 * Substitui a dependência direta do SupabaseService para persistência de sessão.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {

  saveTokens(accessToken: string, refreshToken: string, expiresAt?: number): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (expiresAt != null) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getExpiresAt(): number | null {
    const v = localStorage.getItem(EXPIRES_AT_KEY);
    return v ? Number(v) : null;
  }

  /** Retorna true se o access_token expirou (considera 60s de margem). */
  isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    return Date.now() / 1000 > expiresAt - 60;
  }

  hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }
}
