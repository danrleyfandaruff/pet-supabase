export interface AquisicaoPacote {
  id?: number;
  id_pacote: number;
  id_animal?: number;
  data_aquisicao: string;
  data_pagamento?: string;
  // campos de join
  pacote?: { nome: string; quantidade?: number; recorrencia?: number };
  animal?: { nome: string };
  atendimento?: Array<{
    id: number;
    data: string;
    pago?: boolean;
    status_info?: { nome: string };
  }>;
}
