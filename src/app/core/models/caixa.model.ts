export type TipoCaixa = 'entrada' | 'saida';
export type FormaPagamento = 'PIX' | 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito';

export const FORMAS_PAGAMENTO: FormaPagamento[] = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito'];

export interface Caixa {
  id?: number;
  id_tenant?: string;
  tipo: TipoCaixa;
  descricao: string;
  valor: number;
  data: string;          // formato YYYY-MM-DD
  categoria?: string;
  forma_pagamento?: FormaPagamento | null;
  id_atendimento?: number;
  created_at?: string;
}
