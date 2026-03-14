export interface Pacote {
  id?: number;
  nome: string;
  desconto?: number;
  ativo?: boolean;
  quantidade?: number;
  recorrencia?: number;
  atualizacao?: string;
}
