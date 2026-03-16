import { Component, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { AtendimentoFormComponent } from './atendimento-form.component';
import { CaixaService } from '../../core/services/caixa.service';
import { StatusService } from '../../core/services/status.service';
import { Status } from '../../core/models/status.model';

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimentos.page.html',
  styleUrls: ['./atendimentos.page.scss'],
})
export class AtendimentosPage implements OnInit {
  atendimentos: Atendimento[] = [];
  atendimentosFiltrados: Atendimento[] = [];
  isLoading = false;

  // ── Calendário ─────────────────────────────────────
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  diasCalendario: (number | null)[] = [];
  mesAtual: Date = new Date();
  diaSelecionado: number | null = null;
  mesLabel = '';
  filtroRapido: 'todos' | 'hoje' | 'pendentes' = 'todos';
  countNaoPagos = 0;
  private termoBusca = '';

  // ── Seleção múltipla ────────────────────────────────
  modoSelecao = false;
  selecionados = new Set<number>();

  get countSelecionados() { return this.selecionados.size; }

  toggleModoSelecao() {
    this.modoSelecao = !this.modoSelecao;
    this.selecionados.clear();
  }

  cancelarSelecao() {
    this.modoSelecao = false;
    this.selecionados.clear();
  }

  toggleSelecionado(id: number, event: Event) {
    event.stopPropagation();
    if (this.selecionados.has(id)) {
      this.selecionados.delete(id);
    } else {
      this.selecionados.add(id);
    }
    // força detecção de mudança
    this.selecionados = new Set(this.selecionados);
  }

  selecionarTodos() {
    if (this.selecionados.size === this.atendimentosFiltrados.filter(a => !a.pago).length) {
      this.selecionados.clear();
    } else {
      this.atendimentosFiltrados.filter(a => !a.pago).forEach(a => this.selecionados.add(a.id!));
    }
    this.selecionados = new Set(this.selecionados);
  }

  get todosNaoPagesSelecionados(): boolean {
    const pendentes = this.atendimentosFiltrados.filter(a => !a.pago);
    return pendentes.length > 0 && pendentes.every(a => this.selecionados.has(a.id!));
  }

  isSelecionado(id: number): boolean {
    return this.selecionados.has(id);
  }

  async darBaixaEmLote() {
    if (this.selecionados.size === 0) return;

    const itens = this.atendimentos.filter(a => this.selecionados.has(a.id!) && !a.pago);
    if (itens.length === 0) return;

    const total = itens.reduce((sum, a) => {
      return sum + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0);
    }, 0);

    const alert = await this.alertCtrl.create({
      header: `Dar baixa em ${itens.length} atendimento${itens.length > 1 ? 's' : ''}`,
      message: `Total: R$ ${total.toFixed(2).replace('.', ',')}. Confirmar pagamento e lançar no caixa?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.processarLote(itens) },
      ],
    });
    await alert.present();
  }

  private async processarLote(itens: Atendimento[]) {
    const loading = await this.loadingCtrl.create({ message: 'Registrando pagamentos...', spinner: 'crescent' });
    await loading.present();
    try {
      await Promise.all(itens.map(a => {
        const valor = Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0) || 1;
        const pet = a.animal?.nome || a.cliente?.nome || '';
        const servico = a.servico?.nome || 'Atendimento';
        return Promise.all([
          this.atendimentoService.marcarPago(a.id!),
          this.caixaService.create({
            tipo: 'entrada',
            descricao: pet ? `${servico} — ${pet}` : servico,
            valor,
            data: a.data?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            categoria: 'Banho/Tosa',
            id_atendimento: a.id,
          }),
        ]);
      }));
      await this.showToast(`${itens.length} pagamento${itens.length > 1 ? 's' : ''} registrado${itens.length > 1 ? 's' : ''}! ✓`, 'success');
      this.cancelarSelecao();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(e.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async concluirEmLote() {
    if (this.selecionados.size === 0) return;

    const itens = this.atendimentos.filter(a => this.selecionados.has(a.id!) && !a.pago);
    if (itens.length === 0) return;

    if (!this.statusConcluidoId) {
      await this.showToast('Nenhum status "Concluído" cadastrado em Ajustes.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: `Concluir ${itens.length} atendimento${itens.length > 1 ? 's' : ''}`,
      message: `Marcar ${itens.length > 1 ? 'os atendimentos' : 'o atendimento'} como Concluído sem lançar pagamento?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.processarConclusaoLote(itens) },
      ],
    });
    await alert.present();
  }

  private async processarConclusaoLote(itens: Atendimento[]) {
    const loading = await this.loadingCtrl.create({ message: 'Atualizando status...', spinner: 'crescent' });
    await loading.present();
    try {
      await Promise.all(
        itens.map(a => this.atendimentoService.update(a.id!, { status: this.statusConcluidoId! }))
      );
      await this.showToast(`${itens.length} atendimento${itens.length > 1 ? 's' : ''} concluído${itens.length > 1 ? 's' : ''}! ✓`, 'success');
      this.cancelarSelecao();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(e.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // ── Pagamento ───────────────────────────────────────
  pagamentoAberto = false;
  atendimentoPagamento: Atendimento | null = null;
  valorPagamento: number | null = null;
  descricaoPagamento = '';
  salvandoPagamento = false;

  // Lista e ID de status (carregados no init)
  private statusConcluidoId: number | null = null;
  statusList: Status[] = [];

  constructor(
    private atendimentoService: AtendimentoService,
    private caixaService: CaixaService,
    private statusService: StatusService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.gerarCalendario();
    this.loadData();
    this.carregarStatusConcluido();
  }
  ionViewWillEnter() { this.loadData(); }

  private async carregarStatusConcluido() {
    try {
      const lista = await this.statusService.getAll();
      this.statusList = lista;
      const s = lista.find(x => x.nome?.toLowerCase().includes('conclu'));
      this.statusConcluidoId = s?.id ?? null;
    } catch (_) {}
  }

  // ── Alterar status de um atendimento ─────────────────
  async mudarStatus(atendimento: Atendimento, event: Event) {
    event.stopPropagation();

    const botoes = this.statusList.map(s => ({
      text: s.nome,
      icon: atendimento.status === s.id ? 'checkmark-outline' : 'ellipse-outline',
      cssClass: atendimento.status === s.id ? 'action-sheet-selected' : '',
      handler: async () => {
        if (atendimento.status === s.id) return; // sem mudança
        try {
          await this.atendimentoService.update(atendimento.id!, { status: s.id });
          await this.loadData();
        } catch (e: any) {
          await this.showToast(e.message, 'danger');
        }
      },
    }));

    const sheet = await this.actionSheetCtrl.create({
      header: 'Alterar status',
      buttons: [
        ...botoes,
        { text: 'Cancelar', role: 'cancel', icon: 'close-outline' },
      ],
    });
    await sheet.present();
  }

  // ── Gera os dias do mês no grid ──────────────────────
  gerarCalendario() {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    this.mesLabel = `${meses[mes]} ${ano}`;

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    this.diasCalendario = [];
    for (let i = 0; i < primeiroDia; i++) this.diasCalendario.push(null);
    for (let d = 1; d <= totalDias; d++) this.diasCalendario.push(d);
  }

  prevMonth() {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() - 1, 1);
    this.diaSelecionado = null;
    this.gerarCalendario();
    this.aplicarFiltros();
  }

  nextMonth() {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
    this.diaSelecionado = null;
    this.gerarCalendario();
    this.aplicarFiltros();
  }

  selecionarDia(dia: number) {
    this.diaSelecionado = this.diaSelecionado === dia ? null : dia;
    this.aplicarFiltros();
  }

  limparFiltro() {
    this.diaSelecionado = null;
    this.aplicarFiltros();
  }

  setFiltroRapido(f: 'todos' | 'hoje' | 'pendentes') {
    this.filtroRapido = f;
    if (f !== 'todos') this.diaSelecionado = null;
    this.aplicarFiltros();
  }

  isHoje(dia: number): boolean {
    const hoje = new Date();
    return dia === hoje.getDate() &&
      this.mesAtual.getMonth() === hoje.getMonth() &&
      this.mesAtual.getFullYear() === hoje.getFullYear();
  }

  temAtendimento(dia: number): boolean {
    const dataStr = this.buildDataStr(dia);
    return this.atendimentos.some(a => a.data?.startsWith(dataStr));
  }

  private buildDataStr(dia: number): string {
    const ano = this.mesAtual.getFullYear();
    const mes = String(this.mesAtual.getMonth() + 1).padStart(2, '0');
    const d = String(dia).padStart(2, '0');
    return `${ano}-${mes}-${d}`;
  }

  private aplicarFiltros() {
    // Contagem global de não pagos (ignora outros filtros)
    this.countNaoPagos = this.atendimentos.filter(a => !a.pago).length;

    let lista = [...this.atendimentos];

    // Filtro rápido tem prioridade sobre calendário
    if (this.filtroRapido === 'pendentes') {
      lista = lista.filter(a => !a.pago);
    } else if (this.filtroRapido === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0];
      lista = lista.filter(a => a.data?.startsWith(hoje));
    } else {
      // filtro por mês/dia do calendário
      if (this.diaSelecionado !== null) {
        const dataStr = this.buildDataStr(this.diaSelecionado);
        lista = lista.filter(a => a.data?.startsWith(dataStr));
      } else {
        const ano = this.mesAtual.getFullYear();
        const mes = String(this.mesAtual.getMonth() + 1).padStart(2, '0');
        lista = lista.filter(a => a.data?.startsWith(`${ano}-${mes}`));
      }
    }

    // filtro por busca de texto
    if (this.termoBusca) {
      const q = this.termoBusca;
      lista = lista.filter(a =>
        a.animal?.nome?.toLowerCase().includes(q) ||
        a.cliente?.nome?.toLowerCase().includes(q) ||
        a.responsavel?.nome?.toLowerCase().includes(q) ||
        a.servico?.nome?.toLowerCase().includes(q) ||
        a.data?.includes(q)
      );
    }

    this.atendimentosFiltrados = lista;
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.atendimentos = await this.atendimentoService.getAll();
      this.aplicarFiltros();
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    this.termoBusca = event.target.value?.toLowerCase() || '';
    this.aplicarFiltros();
  }

  formatDate(d: string) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  getBadgeClass(status?: string): string {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('conclu')) return 'badge-success';
    if (s.includes('andamento')) return 'badge-warning';
    if (s.includes('cancel') || s.includes('comparec')) return 'badge-danger';
    if (s.includes('confirm')) return 'badge-primary';
    return 'badge-medium';
  }

  async openForm(atendimento?: Atendimento) {
    const modal = await this.modalCtrl.create({
      component: AtendimentoFormComponent,
      componentProps: { atendimento },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(atendimento: Atendimento) {
    const nome = atendimento.animal?.nome || atendimento.cliente?.nome || 'este atendimento';
    const alert = await this.alertCtrl.create({
      header: 'Excluir atendimento',
      message: `Excluir atendimento de ${nome} em ${this.formatDate(atendimento.data)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(atendimento) },
      ],
    });
    await alert.present();
  }

  async delete(atendimento: Atendimento) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.atendimentoService.delete(atendimento.id!);
      await this.showToast('Atendimento excluído!', 'success');
      await this.loadData();
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { await loading.dismiss(); }
  }

  // ── Pagamento ────────────────────────────────────────
  abrirPagamento(a: Atendimento) {
    this.atendimentoPagamento = a;
    const valorServico = Number(a.servico?.valor ?? 0);
    const valorAdicional = Number(a.valor_adicional ?? 0);
    this.valorPagamento = valorServico + valorAdicional || null;
    const pet = a.animal?.nome || a.cliente?.nome || '';
    const servico = a.servico?.nome || 'Atendimento';
    this.descricaoPagamento = pet ? `${servico} — ${pet}` : servico;
    this.pagamentoAberto = true;
  }

  fecharPagamento() {
    this.pagamentoAberto = false;
    this.atendimentoPagamento = null;
    this.valorPagamento = null;
    this.descricaoPagamento = '';
  }

  async confirmarPagamento() {
    if (!this.atendimentoPagamento || !this.valorPagamento) return;
    this.salvandoPagamento = true;
    try {
      // 1. Marca o atendimento como pago
      await this.atendimentoService.marcarPago(this.atendimentoPagamento.id!);

      // 2. Lança entrada no caixa vinculada ao atendimento
      await this.caixaService.create({
        tipo: 'entrada',
        descricao: this.descricaoPagamento,
        valor: this.valorPagamento,
        data: this.atendimentoPagamento.data?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        categoria: 'Banho/Tosa',
        id_atendimento: this.atendimentoPagamento.id,
      });

      await this.showToast('Pagamento registrado no caixa! ✓', 'success');
      this.fecharPagamento();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(e.message, 'danger');
    } finally {
      this.salvandoPagamento = false;
    }
  }

  async confirmarDesfazerPagamento(a: Atendimento) {
    const nome = a.animal?.nome || a.cliente?.nome || 'este atendimento';
    const alert = await this.alertCtrl.create({
      header: 'Desfazer pagamento',
      message: `Marcar "${nome}" como não pago? O lançamento no caixa também será removido.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Desfazer', role: 'destructive', handler: () => this.desfazerPagamento(a) },
      ],
    });
    await alert.present();
  }

  async desfazerPagamento(a: Atendimento) {
    const loading = await this.loadingCtrl.create({ message: 'Atualizando...', spinner: 'crescent' });
    await loading.present();
    try {
      // Remove o lançamento do caixa vinculado e desmarca o pagamento
      await Promise.all([
        this.caixaService.deleteByAtendimento(a.id!),
        this.atendimentoService.desmarcarPago(a.id!),
      ]);
      await this.showToast('Pagamento desfeito e removido do caixa.', 'warning');
      await this.loadData();
    } catch (e: any) {
      await this.showToast(e.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
