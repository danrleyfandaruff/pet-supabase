import { PerfilUsuario } from './user.model';

export interface Colaborador {
  id: string;
  email?: string;
  nome?: string;
  cargo?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
  id_empresa?: string;
}
