export interface Animal {
  id?: number;
  nome: string;
  data_nascimento?: string;
  id_cliente?: number;
  id_raca?: number;
  ativo?: boolean;
  atualizacao?: string;
  observacoes?: string;
  alergias?: string;
  // campos de join
  cliente?: { nome: string };
  raca?: { nome: string };
}
