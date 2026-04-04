import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Colaborador, ColaboradorDisponibilidade } from '../models/colaborador.model';
import { PerfilUsuario } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  constructor(private api: ApiService) {}

  getAll(): Promise<Colaborador[]> {
    return lastValueFrom(this.api.getColaboradores());
  }

  convidar(data: { email: string; password: string; nome?: string; cargo?: string; perfil?: PerfilUsuario }): Promise<any> {
    return lastValueFrom(this.api.convidarColaborador(data));
  }

  update(id: string, data: { nome?: string; cargo?: string; perfil?: PerfilUsuario; ativo?: boolean }): Promise<any> {
    return lastValueFrom(this.api.atualizarColaborador(id, data));
  }

  updateConfiguracoes(
    id: string,
    data: {
      avatar_url?: string | null;
      percentual_comissao_padrao?: number | null;
      percentual_comissao_banho?: number | null;
      percentual_comissao_tosa?: number | null;
      percentual_comissao_adicional?: number | null;
      disponibilidade_semanal?: ColaboradorDisponibilidade[];
    },
  ): Promise<any> {
    return lastValueFrom(this.api.atualizarConfiguracoesColaborador(id, data));
  }

  adicionarBloqueio(
    id: string,
    data: {
      data: string;
      hora_inicio?: string | null;
      hora_fim?: string | null;
      dia_todo?: boolean;
      descricao?: string | null;
    },
  ): Promise<any> {
    return lastValueFrom(this.api.adicionarBloqueioColaborador(id, data));
  }

  removerBloqueio(bloqueioId: number): Promise<any> {
    return lastValueFrom(this.api.removerBloqueioColaborador(bloqueioId));
  }

  remove(id: string): Promise<any> {
    return lastValueFrom(this.api.removerColaborador(id));
  }
}
