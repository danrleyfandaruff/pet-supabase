import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';
import { addIcons } from 'ionicons';
import { calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline } from 'ionicons/icons';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { CaixaService } from '../../core/services/caixa.service';

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

  // Dashboard
  statsLoading = true;
  atendimentosHoje = 0;
  totalMes = 0;
  pendentesPagamento = 0;

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
    addIcons({ calendar, people, paw, cut, gift, settings, cash, barChartOutline, peopleOutline, layersOutline });
    this.hoje = this.formatarHoje();
  }

  ngOnInit() { this.carregarStats(); }
  ionViewWillEnter() { this.carregarStats(); }

  async carregarStats() {
    this.statsLoading = true;
    try {
      const [hoje, total, pendentes] = await Promise.all([
        this.atendimentoService.getHoje(),
        this.caixaService.getTotalMesAtual(),
        this.atendimentoService.countPendentes(),
      ]);
      this.atendimentosHoje   = hoje.length;
      this.totalMes           = total;
      this.pendentesPagamento = pendentes;
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
}
