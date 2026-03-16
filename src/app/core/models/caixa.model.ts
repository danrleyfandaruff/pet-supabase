export type TipoCaixa = 'entrada' | 'saida';

export interface Caixa {
  id?: number;
  id_tenant?: string;
  tipo: TipoCaixa;
  descricao: string;
  valor: number;
  data: string;          // formato YYYY-MM-DD
  categoria?: string;
  id_atendimento?: number;
  created_at?: string;
}
