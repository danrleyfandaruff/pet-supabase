export interface AquisicaoPacote {
  id?: number;
  id_pacote: number;
  id_animal?: number;
  data_aquisicao: string;
  data_pagamento?: string;
  // campos de join
  pacote?: { nome: string };
  animal?: { nome: string };
}
