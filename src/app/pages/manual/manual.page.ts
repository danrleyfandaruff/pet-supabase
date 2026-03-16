import { Component } from '@angular/core';
import { Router } from '@angular/router';

export interface ManualSlide {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  tips: string[];
}

@Component({
  selector: 'app-manual',
  templateUrl: './manual.page.html',
  styleUrls: ['./manual.page.scss'],
})
export class ManualPage {
  currentIndex = 0;
  naoMostrarMais = false;

  readonly STORAGE_KEY = 'groomerlab360_manual_visto';

  slides: ManualSlide[] = [
    {
      icon: 'paw',
      iconColor: '#3880ff',
      title: 'Bem-vindo ao GroomerLab360!',
      description: 'Tudo que você precisa para gerenciar seu banho e tosa em um só lugar.',
      tips: [
        'Início — dashboard com resumo do dia e acesso rápido',
        'Pets — histórico completo de cada animal',
        'Agenda (botão central) — o coração do sistema',
        'Caixa — entradas e saídas com gráfico mensal',
        'Ajustes — configure raças, responsáveis e mais',
      ],
    },
    {
      icon: 'settings',
      iconColor: '#92949c',
      title: '1º — Configure antes de começar',
      description: 'Em Ajustes, cadastre os dados auxiliares usados no dia a dia.',
      tips: [
        'Raças — ex: Poodle, Shih Tzu, Lhasa Apso',
        'Responsáveis — funcionários que fazem os atendimentos',
        'Status — etapas como Agendado, Em andamento, Concluído',
        'Tipos de Serviço — Banho, Tosa, Estética, etc.',
      ],
    },
    {
      icon: 'cut',
      iconColor: '#7044ff',
      title: '2º — Serviços e Pacotes',
      description: 'Crie o catálogo com preços e pacotes de fidelidade com desconto.',
      tips: [
        'Acesse Serviços ou Pacotes nos cards da tela Início',
        'Informe nome, tipo e valor para cada serviço',
        'Pacotes permitem definir quantidade de atendimentos e % de desconto',
        'Vincule um pacote ao agendamento para aplicar o desconto',
      ],
    },
    {
      icon: 'people',
      iconColor: '#5260ff',
      title: '3º — Tutores e Pets',
      description: 'Cadastre os donos e seus animais. Cada pet tem um histórico completo.',
      tips: [
        'Acesse Tutores e Pets nos cards da tela Início',
        'Um tutor pode ter vários pets vinculados',
        'Na tela de Pets, toque no ícone de relógio para ver o histórico',
        'O histórico mostra todos os atendimentos, datas e status de pagamento',
      ],
    },
    {
      icon: 'calendar',
      iconColor: '#3880ff',
      title: '4º — Agenda',
      description: 'Agende, filtre e dê baixa nos atendimentos com controle de pagamento.',
      tips: [
        'Use o calendário para filtrar por dia — pontos indicam dias com agenda',
        'Chips: Todos · Hoje · Não pagos (com contador de pendências)',
        'Toque no $ verde para registrar o pagamento — valor preenchido automaticamente',
        'Atendimentos pagos ficam marcados e podem ter o pagamento desfeito',
      ],
    },
    {
      icon: 'cash',
      iconColor: '#2dd36f',
      title: '5º — Controle de Caixa',
      description: 'Entradas e saídas financeiras com gráfico dos últimos 6 meses.',
      tips: [
        'Ao dar baixa em um atendimento, a entrada é criada automaticamente',
        'Ao desfazer o pagamento, a entrada é removida do caixa também',
        'Use o + no canto inferior para lançamentos manuais (despesas, etc.)',
        'O gráfico de barras mostra entradas x saídas por mês',
        'Filtre por Mês, Semana ou Todos para diferentes visões',
      ],
    },
    {
      icon: 'gift',
      iconColor: '#ffc409',
      title: 'Dashboard — Visão Geral',
      description: 'A tela Início mostra um resumo em tempo real do seu negócio.',
      tips: [
        'Atendimentos hoje — quantos estão agendados para o dia',
        'Recebido no mês — total das entradas do mês corrente',
        'Sem pagamento — atendimentos realizados ainda não pagos',
        'Toque em qualquer card para ir direto à tela correspondente',
      ],
    },
    {
      icon: 'checkmark-circle',
      iconColor: '#2dd36f',
      title: 'Tudo pronto!',
      description: 'Você conhece o sistema completo. Comece pela configuração e faça seu primeiro agendamento!',
      tips: [
        'Ordem recomendada: Ajustes → Serviços → Tutores → Pets → Agenda',
        'Para um atendimento avulso: crie direto na Agenda sem tutor/pet',
        'Dúvidas? Reveja este guia a qualquer momento em Ajustes',
      ],
    },
  ];

  get isFirst(): boolean { return this.currentIndex === 0; }
  get isLast(): boolean { return this.currentIndex === this.slides.length - 1; }
  get currentSlide(): ManualSlide { return this.slides[this.currentIndex]; }

  constructor(private router: Router) {}

  next() { if (!this.isLast) this.currentIndex++; }
  prev() { if (!this.isFirst) this.currentIndex--; }
  goTo(index: number) { this.currentIndex = index; }

  finish() {
    if (this.naoMostrarMais) {
      localStorage.setItem(this.STORAGE_KEY, 'true');
    }
    this.router.navigate(['/tabs'], { replaceUrl: true });
  }

  static jaVisto(): boolean {
    return localStorage.getItem('groomerlab360_manual_visto') === 'true';
  }
}
