import { Injectable } from '@angular/core';

/**
 * @deprecated Removido — toda a comunicação agora passa pelo NestJS via ApiService.
 * Mantido apenas para evitar erros de compilação caso algum import residual exista.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {}
