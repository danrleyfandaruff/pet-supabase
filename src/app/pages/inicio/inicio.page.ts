import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';
import { addIcons } from 'ionicons';
import { calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline, checkmarkCircle, timeOutline, alertCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, calendarOutline } from 'ionicons/icons';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { CaixaService } from '../../core/services/caixa.service';
import { Atendimento } from '../../core/models/atendimento.model';

interface SmallCard {
  label: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {
  currentUser$: Observable<User | null>;
  hoje: string = '';

  // Stats gerais
  statsLoading = true;
  atendimentosHoje = 0;
  totalMes = 0;
  pendentesPagamento = 0;

  // Dashboard do dia
  atendimentosHojeList: Atendimento[] = [];
  receitaHoje = 0;
  atendimentosPagosHoje = 0;
  mostrarTodosHoje = false;
  readonly LIMITE_HOJE = 3;

  get atendimentosHojeVisiveis(): Atendimento[] {
    return this.mostrarTodosHoje
      ? this.atendimentosHojeList
      : this.atendimentosHojeList.slice(0, this.LIMITE_HOJE);
  }

  get temMaisHoje(): boolean {
    return this.atendimentosHojeList.length > this.LIMITE_HOJE;
  }

  smallCards: SmallCard[] = [
    { label: 'Tutores',    icon: 'people',          color: 'blue',   route: '/tabs/clientes'  },
    { label: 'Pets',       icon: 'paw',             color: 'green',  route: '/tabs/animais'   },
    { label: 'Serviços',   icon: 'cut',             color: 'purple', route: '/tabs/servicos'  },
    { label: 'Pacotes',    icon: 'gift',            color: 'orange', route: '/tabs/pacotes'   },
    { label: 'Planos',     icon: 'layers-outline',  color: 'teal',   route: '/tabs/planos'    },
    { label: 'Relatórios', icon: 'bar-chart-outline', color: 'indigo', route: '/tabs/relatorios' },
    { label: 'Comissões',  icon: 'people-outline',  color: 'pink',   route: '/tabs/comissoes' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private atendimentoService: AtendimentoService,
    private caixaService: CaixaService,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    addIcons({ calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline, checkmarkCircle, timeOutline, alertCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, calendarOutline });
    this.hoje = this.formatarHoje();
  }

  ngOnInit() { this.carregarStats(); }
  ionViewWillEnter() { this.carregarStats(); }

  async carregarStats() {
    this.statsLoading = true;
    this.mostrarTodosHoje = false;
    try {
      const dataHoje = new Date().toISOString().split('T')[0];
      const [atendHoje, total, pendentes, caixaHoje] = await Promise.all([
        this.atendimentoService.getHoje(),
        this.caixaService.getTotalMesAtual(),
        this.atendimentoService.countPendentes(),
        this.caixaService.getByPeriodo(dataHoje, dataHoje),
      ]);

      this.atendimentosHojeList = atendHoje;
      this.atendimentosHoje     = atendHoje.length;
      this.totalMes             = total;
      this.pendentesPagamento   = pendentes;

      // Receita do dia: soma das ENTRADAS do caixa com data de hoje
      const entradasHoje = caixaHoje.filter(c => c.tipo === 'entrada');
      this.atendimentosPagosHoje = entradasHoje.length;
      this.receitaHoje = entradasHoje.reduce((sum, c) => sum + Number(c.valor ?? 0), 0);
    } catch (_) {}
    finally { this.statsLoading = false; }
  }

  private formatarHoje(): string {
    const d = new Date();
    const dias  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
  }

  primeiroNome(nome?: string): string {
    return nome?.split(' ')[0] ?? '';
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  getStatusClass(a: Atendimento): string {
    if (a.pago) return 'status-pago';
    const nome = a.status_info?.nome?.toLowerCase() ?? '';
    if (nome.includes('conclu')) return 'status-concluido';
    if (nome.includes('cancel')) return 'status-cancelado';
    return 'status-pendente';
  }

  getStatusIcon(a: Atendimento): string {
    if (a.pago) return 'checkmark-circle';
    const nome = a.status_info?.nome?.toLowerCase() ?? '';
    if (nome.includes('cancel')) return 'alert-circle-outline';
    return 'time-outline';
  }
}
