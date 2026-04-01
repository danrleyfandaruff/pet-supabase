import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissaoService, Permissao } from '../../core/services/permissao.service';
import {lastValueFrom, Observable, Subscription} from 'rxjs';
import { User } from '../../core/models/user.model';
import { addIcons } from 'ionicons';
import { calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline, checkmarkCircle, timeOutline, alertCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, calendarOutline } from 'ionicons/icons';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { CaixaService } from '../../core/services/caixa.service';
import { Atendimento } from '../../core/models/atendimento.model';
import {ApiService} from "@core/services/api.service";

interface SmallCard {
  label: string;
  icon: string;
  color: string;
  route: string;
}

const ALL_CARDS: (SmallCard & { permissao?: Permissao })[] = [
  { label: 'Tutores',    icon: 'people',            color: 'blue',   route: '/tabs/clientes',   permissao: 'ver_clientes'      },
  { label: 'Pets',       icon: 'paw',               color: 'green',  route: '/tabs/animais'                                    },
  { label: 'Serviços',   icon: 'cut',               color: 'purple', route: '/tabs/servicos',   permissao: 'ver_configuracoes' },
  { label: 'Pacotes',    icon: 'gift',              color: 'orange', route: '/tabs/pacotes',    permissao: 'ver_configuracoes' },
  { label: 'Planos',     icon: 'layers-outline',    color: 'teal',   route: '/tabs/planos'                                    },
  { label: 'Relatórios', icon: 'bar-chart-outline', color: 'indigo', route: '/tabs/relatorios', permissao: 'ver_relatorios'    },
  { label: 'Comissões',  icon: 'people-outline',    color: 'pink',   route: '/tabs/comissoes',  permissao: 'ver_relatorios'    },
];

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  hoje: string = '';

  // Stats gerais
  statsLoading = true;
  atendimentosHoje = 0;
  totalMes = 0;
  pendentesPagamento = 0;

  // Dashboard do dia
  atendimentosHojeList: Atendimento[] = [];
  atendimentosHojeVisiveis: Atendimento[] = [];
  receitaHoje = 0;
  atendimentosPagosHoje = 0;
  mostrarTodosHoje = false;
  temMaisHoje = false;
  readonly LIMITE_HOJE = 3;

  // Cards de acesso rápido — propriedade normal, não getter
  smallCards: SmallCard[] = [];

  private userSub?: Subscription;
  resumoIA = '';
  resumoCarregando = true; // inicia carregando para mostrar spinner imediatamente
  resumoErro = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    public permissao: PermissaoService,
    private atendimentoService: AtendimentoService,
    private caixaService: CaixaService,
    private apiService: ApiService,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    addIcons({ calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline, checkmarkCircle, timeOutline, alertCircleOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, calendarOutline });
    this.hoje = this.formatarHoje();
  }

  ngOnInit() {
    // Atualiza os cards sempre que o perfil do usuário mudar (login/logout)
    this.userSub = this.authService.currentUser$.subscribe(() => {
      this.smallCards = ALL_CARDS.filter(
        c => !c.permissao || this.permissao.pode(c.permissao),
      );
    });
    this.carregarStats();
    this.carregarResumo();
  }

  ionViewWillEnter() { this.carregarStats(); }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }


  async carregarResumo() {
    this.resumoCarregando = true;
    this.resumoErro = false;
    try {
      const res = await lastValueFrom(this.apiService.getResumoDia());
      console.log(`AAAAAAAAA`, res)
      this.resumoIA = res.resumo;
    } catch {
      this.resumoErro = true;
    } finally {
      this.resumoCarregando = false;
    }
  }

  toggleMostrarTodos() {
    this.mostrarTodosHoje = !this.mostrarTodosHoje;
    this.atualizarVisiveis();
  }

  private atualizarVisiveis() {
    this.temMaisHoje = this.atendimentosHojeList.length > this.LIMITE_HOJE;
    this.atendimentosHojeVisiveis = this.mostrarTodosHoje
      ? this.atendimentosHojeList
      : this.atendimentosHojeList.slice(0, this.LIMITE_HOJE);
  }

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
      this.atualizarVisiveis();

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
