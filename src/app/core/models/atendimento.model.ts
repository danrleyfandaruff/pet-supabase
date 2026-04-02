export interface Atendimento {
  id?: number;
  id_cliente?: number;
  id_animal?: number;
  id_responsavel?: number;
  id_colaborador?: string;
  id_servico?: number;
  id_pacote?: number;
  id_aquisicao_pacote?: number;
  data: string;
  horario?: string;        // HH:MM — ex: "09:30"
  status?: number;
  valor_adicional?: number;
  pago?: boolean;
  // campos de join
  cliente?: { nome: string };
  animal?: { nome: string; id_cliente?: number };
  colaborador?: { nome: string };
  responsavel?: { nome: string };
  status_info?: { nome: string };
  servico?: { nome: string; valor?: number };
  pacote?: { nome: string };
}
