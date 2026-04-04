import { PerfilUsuario } from './user.model';

export interface ColaboradorDisponibilidade {
  id?: number;
  dia_semana: number;
  ativo: boolean;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  intervalo_inicio?: string | null;
  intervalo_fim?: string | null;
}

export interface ColaboradorBloqueio {
  id?: number;
  data: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  dia_todo?: boolean;
  descricao?: string | null;
}

export interface Colaborador {
  id: string;
  email?: string;
  nome?: string;
  cargo?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
  id_empresa?: string;
  avatar_url?: string | null;
  percentual_comissao_padrao?: number | null;
  percentual_comissao_banho?: number | null;
  percentual_comissao_tosa?: number | null;
  percentual_comissao_adicional?: number | null;
  disponibilidade_semanal?: ColaboradorDisponibilidade[];
  bloqueios?: ColaboradorBloqueio[];
}
