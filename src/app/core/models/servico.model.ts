export interface Servico {
  id?: number;
  nome: string;
  valor?: number;
  id_tipo_servico?: number;
  ativo?: boolean;
  atualizacao?: string;
  // campo de join
  tipo_servico?: { nome: string };
}
