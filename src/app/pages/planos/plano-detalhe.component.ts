import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActionSheetController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { StatusService } from '../../core/services/status.service';
import { Status } from '../../core/models/status.model';

export interface SessaoVm {
  id: number;
  data: string;
  sessaoNum: number;
  statusId: number | null;
  statusNome: string;
  pago: boolean;
  servicoNome: string;
  concluida: boolean;
  proxima: boolean;
  atualizando: boolean;
}

export interface PlanoDetalheInput {
  petNome: string;
  pacoteNome: string;
  total: number;
  concluidos: number;
  proxData: string | null;
  atendimentos: Array<{
    id: number;
    data: string;
    pago?: boolean;
    status?: number;
    status_info?: { id?: number; nome: string };
    servico?: { nome: string; valor?: number };
  }>;
}

@Component({
  selector: 'app-plano-detalhe',
  templateUrl: './plano-detalhe.component.html',
  styleUrls: ['./plano-detalhe.component.scss'],
})
export class PlanoDetalheComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() plano!: PlanoDetalheInput;

  sessoes: SessaoVm[] = [];
  statusList: Status[] = [];
  isLoading = true;
  alterado = false; // indica se algo foi salvo (para reload na página pai)

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private atendimentoService: AtendimentoService,
    private statusService: StatusService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // Ionic define componentProps após a instanciação — rebuildar sempre que plano mudar
    if (changes['plano'] && this.plano) {
      this.construirSessoes();
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async ngOnInit() {
    // Garante que a lista é construída mesmo se ngOnChanges não disparar antes
    if (this.plano) {
      this.construirSessoes();
    }
    this.isLoading = false;
    this.cdr.detectChanges();

    // Carrega lista de status em segundo plano para o ActionSheet
    try {
      this.statusList = await this.statusService.getAll();
    } catch {
      // lista de status vazia — trocar status ficará desabilitado silenciosamente
    }
  }

  ngAfterViewInit() {
    // Última linha de defesa: se sessoes ainda estiver vazia com plano disponível, reconstruir
    if (this.sessoes.length === 0 && this.plano?.atendimentos?.length) {
      this.construirSessoes();
      this.cdr.detectChanges();
    }
  }

  private construirSessoes() {
    if (!this.plano?.atendimentos?.length) {
      this.sessoes = [];
      return;
    }
    this.sessoes = this.plano.atendimentos
      .slice()
      .sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
      .map((at, i) => {
        const concluida = !!(at.pago || at.status_info?.nome?.toLowerCase().includes('conclu'));
        return {
          id:          at.id,
          data:        at.data,
          sessaoNum:   i + 1,
          statusId:    at.status ?? at.status_info?.id ?? null,
          statusNome:  at.status_info?.nome ?? 'Agendado',
          pago:        !!at.pago,
          servicoNome: at.servico?.nome ?? '',
          concluida,
          proxima:     at.data === this.plano.proxData && !concluida,
          atualizando: false,
        };
      });
  }

  // ── Progresso ──────────────────────────────────────────────────────────────

  get progresso(): number {
    if (!this.plano.total) return 0;
    return Math.round((this.plano.concluidos / this.plano.total) * 100);
  }

  get concluidosAtuais(): number {
    return this.sessoes.filter(s => s.concluida).length;
  }

  // ── Trocar status via ActionSheet ──────────────────────────────────────────

  async trocarStatus(sessao: SessaoVm) {
    if (sessao.atualizando) return;

    const buttons = this.statusList.map(s => ({
      text:    s.nome,
      icon:    this.iconePorStatus(s.nome),
      cssClass: sessao.statusId === s.id ? 'action-selected' : '',
      handler: () => { this.salvarStatus(sessao, s); },
    }));

    buttons.push({ text: 'Cancelar', icon: 'close-outline', cssClass: 'action-cancel', handler: () => {} });

    const sheet = await this.actionSheetCtrl.create({
      header: `Sessão ${sessao.sessaoNum} — ${this.formatDate(sessao.data)}`,
      subHeader: `Status atual: ${sessao.statusNome}`,
      buttons,
    });
    await sheet.present();
  }

  private async salvarStatus(sessao: SessaoVm, novoStatus: Status) {
    if (sessao.statusId === novoStatus.id) return; // sem mudança

    sessao.atualizando = true;
    try {
      await this.atendimentoService.update(sessao.id, { status: novoStatus.id });

      // Atualiza estado local
      sessao.statusId   = novoStatus.id ?? null;
      sessao.statusNome = novoStatus.nome;
      sessao.concluida  = novoStatus.nome.toLowerCase().includes('conclu');

      this.alterado = true;
      await this.showToast(`Sessão ${sessao.sessaoNum} → ${novoStatus.nome}`, 'success');
    } catch (e: any) {
      await this.showToast(e.message ?? 'Erro ao salvar', 'danger');
    } finally {
      sessao.atualizando = false;
    }
  }

  // ── Formatação ─────────────────────────────────────────────────────────────

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const dias  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  iconePorStatus(nome: string): string {
    const n = nome.toLowerCase();
    if (n.includes('conclu') || n.includes('realiz')) return 'checkmark-circle-outline';
    if (n.includes('cancel'))                          return 'close-circle-outline';
    if (n.includes('agend'))                           return 'calendar-outline';
    if (n.includes('pago')  || n.includes('pag'))      return 'cash-outline';
    if (n.includes('atend'))                           return 'cut-outline';
    return 'ellipse-outline';
  }

  corPorStatus(nome: string): string {
    const n = nome.toLowerCase();
    if (n.includes('conclu') || n.includes('realiz')) return 'success';
    if (n.includes('cancel'))                          return 'danger';
    if (n.includes('agend'))                           return 'primary';
    if (n.includes('pago'))                            return 'success';
    if (n.includes('atend'))                           return 'warning';
    return 'medium';
  }

  // ── Fechar ─────────────────────────────────────────────────────────────────

  trackById(_: number, s: SessaoVm) { return s.id; }

  fechar() {
    this.modalCtrl.dismiss({ alterado: this.alterado });
  }

  private async showToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({
      message: msg, duration: 2000, color, position: 'top',
    });
    await t.present();
  }
}
