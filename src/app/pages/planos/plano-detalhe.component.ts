import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { errorMsg } from '../../core/utils/error.utils';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { StatusService } from '../../core/services/status.service';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { CaixaService } from '../../core/services/caixa.service';
import { Status } from '../../core/models/status.model';
import { FORMAS_PAGAMENTO, FormaPagamento } from '../../core/models/caixa.model';

export interface SessaoVm {
  id: number;
  data: string;
  sessaoNum: number;
  statusId: number | null;
  statusNome: string;
  pago: boolean;
  servicoNome: string;
  valor: number;
  concluida: boolean;
  proxima: boolean;
  atualizando: boolean;
}

@Component({
  selector: 'app-plano-detalhe',
  templateUrl: './plano-detalhe.component.html',
  styleUrls: ['./plano-detalhe.component.scss'],
})
export class PlanoDetalheComponent implements OnInit {
  @Input() aquisicaoId!: number;
  @Input() petNome = '';
  @Input() pacoteNome = '';
  @Input() total = 0;
  @Input() proxData: string | null = null;

  sessoes: SessaoVm[] = [];
  statusList: Status[] = [];
  isLoading = true;
  alterado = false;
  erro = false;

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private atendimentoService: AtendimentoService,
    private aquisicaoService: AquisicaoPacoteService,
    private statusService: StatusService,
    private caixaService: CaixaService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      const [ats, statusList] = await Promise.all([
        this.aquisicaoService.getSessoes(this.aquisicaoId),
        this.statusService.getAll().catch(() => [] as Status[]),
      ]);

      this.statusList = statusList;

      this.sessoes = (ats ?? [])
        .slice()
        .sort((a: any, b: any) => (a.data ?? '').localeCompare(b.data ?? ''))
        .map((at: any, i: number) => {
          const statusNome = statusList.find((s: Status) => s.id === at.status)?.nome ?? 'Agendado';
          const concluida  = !!(at.pago || statusNome.toLowerCase().includes('conclu'));
          return {
            id:          at.id,
            data:        at.data,
            sessaoNum:   i + 1,
            statusId:    at.status ?? null,
            statusNome,
            pago:        !!at.pago,
            servicoNome: at.servico?.nome ?? '',
            valor:       Number(at.servico?.valor ?? 0) + Number(at.valor_adicional ?? 0),
            concluida,
            proxima:     at.data === this.proxData && !concluida,
            atualizando: false,
          } as SessaoVm;
        });
    } catch (e: any) {
      this.erro = true;
      await this.showToast(errorMsg(e, 'Erro ao carregar sessões'), 'danger');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ── Progresso ──────────────────────────────────────────────────────────────

  get progresso(): number {
    if (!this.total) return 0;
    const concluidos = this.sessoes.filter(s => s.concluida).length;
    return Math.round((concluidos / this.total) * 100);
  }

  get concluidosAtuais(): number {
    return this.sessoes.filter(s => s.concluida).length;
  }

  // ── Marcar / desmarcar pago ────────────────────────────────────────────────

  async togglePago(sessao: SessaoVm) {
    if (sessao.atualizando) return;

    if (sessao.pago) {
      // Desmarcar: remove caixa + desmarca pago
      sessao.atualizando = true;
      try {
        await Promise.all([
          this.caixaService.deleteByAtendimento(sessao.id),
          this.atendimentoService.desmarcarPago(sessao.id),
        ]);
        sessao.pago = false;
        this.alterado = true;
        this.cdr.detectChanges();
        await this.showToast(`Sessão ${sessao.sessaoNum} desmarcada como paga`, 'medium');
      } catch (e: any) {
        await this.showToast(errorMsg(e, 'Erro ao desfazer pagamento'), 'danger');
      } finally {
        sessao.atualizando = false;
      }
      return;
    }

    // Marcar: escolhe forma de pagamento primeiro
    const formaButtons: { text: string; icon: string; role?: string; handler: () => void }[] =
      (FORMAS_PAGAMENTO as FormaPagamento[]).map(f => ({
        text: f,
        icon: this.iconeFormaPagamento(f),
        handler: () => { this.confirmarPagamento(sessao, f); },
      }));
    formaButtons.push({ text: 'Cancelar', icon: 'close-outline', role: 'cancel', handler: () => {} });

    const sheet = await this.actionSheetCtrl.create({
      header: `Sessão ${sessao.sessaoNum} — Forma de pagamento`,
      subHeader: sessao.valor > 0
        ? `Valor: R$ ${sessao.valor.toFixed(2).replace('.', ',')}`
        : undefined,
      buttons: formaButtons,
    });
    await sheet.present();
  }

  private async confirmarPagamento(sessao: SessaoVm, forma: FormaPagamento) {
    const hoje = new Date().toISOString().split('T')[0];

    const alert = await this.alertCtrl.create({
      header: 'Data do pagamento',
      inputs: [
        {
          name: 'data',
          type: 'date',
          value: hoje,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: (d) => this.processarPagamento(sessao, forma, d.data || hoje),
        },
      ],
    });
    await alert.present();
  }

  private async processarPagamento(sessao: SessaoVm, forma: FormaPagamento, data: string) {
    sessao.atualizando = true;
    try {
      const valor = sessao.valor || 1;
      const descricao = sessao.servicoNome
        ? `${sessao.servicoNome} — ${this.petNome}`
        : `Sessão ${sessao.sessaoNum} — ${this.petNome}`;

      await Promise.all([
        this.atendimentoService.marcarPago(sessao.id),
        this.caixaService.create({
          tipo: 'entrada',
          descricao,
          valor,
          data,
          categoria: 'Banho/Tosa',
          forma_pagamento: forma,
          id_atendimento: sessao.id,
        }),
      ]);

      sessao.pago = true;
      this.alterado = true;
      this.cdr.detectChanges();
      await this.showToast(`Sessão ${sessao.sessaoNum} paga via ${forma} ✓`, 'success');
    } catch (e: any) {
      await this.showToast(errorMsg(e, 'Erro ao registrar pagamento'), 'danger');
    } finally {
      sessao.atualizando = false;
    }
  }

  private iconeFormaPagamento(forma: FormaPagamento): string {
    switch (forma) {
      case 'PIX':           return 'qr-code-outline';
      case 'Dinheiro':      return 'cash-outline';
      case 'Cartão Débito': return 'card-outline';
      case 'Cartão Crédito':return 'card-outline';
      default:              return 'wallet-outline';
    }
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
      await this.showToast(errorMsg(e, 'Erro ao salvar'), 'danger');
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
