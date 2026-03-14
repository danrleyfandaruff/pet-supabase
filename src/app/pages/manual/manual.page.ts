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
      description: 'Gerencie seu banho e tosa de forma simples e rápida. Veja como funciona o fluxo básico.',
      tips: [
        'Menu Início tem acesso rápido a tudo',
        'Navegue pelos slides para aprender o fluxo',
        'Você pode rever este tutorial em Ajustes',
      ],
    },
    {
      icon: 'settings',
      iconColor: '#92949c',
      title: '1º — Configure antes de começar',
      description: 'Em Ajustes, cadastre os dados auxiliares que serão usados no dia a dia.',
      tips: [
        'Raças — tipos de raça dos pets (ex: Poodle, Shih Tzu)',
        'Responsáveis — funcionários que realizam os atendimentos',
        'Status — etapas do atendimento (Agendado, Em andamento...)',
        'Tipos de Serviço — categorias como Banho, Tosa, Estética',
      ],
    },
    {
      icon: 'cut',
      iconColor: '#7044ff',
      title: '2º — Cadastre os Serviços',
      description: 'Crie o catálogo de serviços que seu banho e tosa oferece, com nome, tipo e valor.',
      tips: [
        'Acesse Serviços no menu Início',
        'Toque em + para criar um novo serviço',
        'Informe o nome (ex: Banho simples), tipo e valor (ex: R$ 45,00)',
        'Você pode ativar ou desativar serviços a qualquer momento',
      ],
    },
    {
      icon: 'people',
      iconColor: '#5260ff',
      title: '3º — Cadastre os Tutores',
      description: 'Tutores são os donos dos pets. Cadastre nome, telefone e e-mail para contato.',
      tips: [
        'Acesse Tutores no menu Início',
        'Toque em + para cadastrar um novo tutor',
        'Telefone é importante para confirmação de agendamento',
        'Tutor pode ter vários pets vinculados',
      ],
    },
    {
      icon: 'paw',
      iconColor: '#2dd36f',
      title: '4º — Cadastre os Pets',
      description: 'Registre os animais de cada tutor com nome, raça e data de nascimento.',
      tips: [
        'Acesse Pets no menu Início',
        'Toque em + para cadastrar um pet',
        'Vincule o pet ao tutor (dono) correspondente',
        'A raça é opcional, mas ajuda a identificar o animal',
      ],
    },
    {
      icon: 'calendar',
      iconColor: '#3880ff',
      title: '5º — Agende os Atendimentos',
      description: 'Na Agenda você registra cada visita ao petshop — é o coração do sistema.',
      tips: [
        'Tutor e Pet são opcionais — pode agendar avulso',
        'Se escolher o tutor, os pets dele aparecem automaticamente',
        'Selecione o serviço para calcular o valor automaticamente',
        'Adicione um valor extra no campo "Valor adicional" se necessário',
        'Atualize o status conforme o dia avança',
      ],
    },
    {
      icon: 'gift',
      iconColor: '#ffc409',
      title: 'Extra — Pacotes de Fidelidade',
      description: 'Crie pacotes com desconto para clientes frequentes e vincule no agendamento.',
      tips: [
        'Acesse Pacotes no menu Início',
        'Defina a quantidade de atendimentos e o desconto (%)',
        'No agendamento, selecione o plano no campo "Plano/Pacote"',
        'Ideal para clientes que vêm toda semana',
      ],
    },
    {
      icon: 'checkmark-circle',
      iconColor: '#2dd36f',
      title: 'Tudo pronto!',
      description: 'Agora você conhece o fluxo completo. Comece configurando e faça seu primeiro agendamento!',
      tips: [
        'Ordem recomendada: Ajustes → Serviços → Tutores → Pets → Agenda',
        'Para banho avulso: basta criar o agendamento diretamente',
        'Dúvidas? Acesse este manual em Ajustes a qualquer hora',
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
