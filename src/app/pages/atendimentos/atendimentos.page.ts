import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { AtendimentoFormComponent } from './atendimento-form.component';
import { CaixaService } from '../../core/services/caixa.service';
import { StatusService } from '../../core/services/status.service';
import { Status } from '../../core/models/status.model';
import { FORMAS_PAGAMENTO, FormaPagamento } from '../../core/models/caixa.model';

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimentos.page.html',
  styleUrls: ['./atendimentos.page.scss'],
})
export class AtendimentosPage implements OnInit, OnDestroy {
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

  // ── Google Calendar day timeline ────────────────────
  readonly horasGrid: string[] = Array.from({ length: 15 }, (_, i) => {
    const h = i + 7;
    return `${String(h).padStart(2, '0')}:00`;
  });
  readonly GRID_START_HOUR = 7;
  readonly SLOT_HEIGHT = 64; // px por hora

  nowTop = 0;
  private nowTimer: any;
  diasStrip: { iso: string; num: number; dow: string; isHoje: boolean }[] = [];

  get atendimentosDoDia(): Atendimento[] {
    if (!this.diaSelecionado) return [];
    const dataStr = this.buildDataStr(this.diaSelecionado);
    return this.atendimentos
      .filter(a => a.data?.startsWith(dataStr))
      .sort((a, b) => (a.horario || '99:99').localeCompare(b.horario || '99:99'));
  }

  get atendimentosComHorario(): Atendimento[] {
    return this.atendimentosDoDia.filter(a => !!a.horario);
  }

  get atendimentosSemHorario(): Atendimento[] {
    return this.atendimentosDoDia.filter(a => !a.horario);
  }

  get isDiaSelecionadoHoje(): boolean {
    const hoje = new Date();
    return this.diaSelecionado === hoje.getDate() &&
      this.mesAtual.getMonth() === hoje.getMonth() &&
      this.mesAtual.getFullYear() === hoje.getFullYear();
  }

  get diaSelecionadoLabel(): string {
    if (!this.diaSelecionado) return '';
    const d = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), this.diaSelecionado);
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dias[d.getDay()]}, ${this.diaSelecionado} ${meses[d.getMonth()]}`;
  }

  getEventTop(horario: string): number {
    const [h, m] = horario.split(':').map(Number);
    return Math.max(0, (h * 60 + m - this.GRID_START_HOUR * 60) / 60 * this.SLOT_HEIGHT);
  }

  /**
   * Calcula posição (left + width) de cada evento para evitar sobreposição.
   * Eventos no mesmo horário (±52min) ficam lado a lado, dividindo a largura.
   */
  get eventLayoutMap(): Map<number, { left: string; width: string }> {
    const events = this.atendimentosComHorario;
    const map = new Map<number, { left: string; width: string }>();
    const DURATION = 52; // minutos assumidos por evento
    const L = 58;        // px da margem esquerda (labels de hora)
    const R = 8;         // px da margem direita

    events.forEach(ev => {
      const [h, m] = ev.horario!.split(':').map(Number);
      const start = h * 60 + m;
      const end   = start + DURATION;

      // Todos os eventos que se sobrepõem a este
      const group = events.filter(other => {
        const [oh, om] = other.horario!.split(':').map(Number);
        const os = oh * 60 + om;
        return os < end && (os + DURATION) > start;
      });

      const total = group.length;
      const col   = group.indexOf(ev);

      const left  = total === 1
        ? `${L}px`
        : `calc(${L}px + (100% - ${L}px - ${R}px) * ${col} / ${total})`;
      const width = total === 1
        ? `calc(100% - ${L}px - ${R}px)`
        : `calc((100% - ${L}px - ${R}px) / ${total} - 3px)`;

      map.set(ev.id!, { left, width });
    });

    return map;
  }

  private updateNowTop() {
    const now = new Date();
    this.nowTop = Math.max(0, (now.getHours() * 60 + now.getMinutes() - this.GRID_START_HOUR * 60) / 60 * this.SLOT_HEIGHT);
  }

  private gerarDiasStrip() {
    const hoje = new Date();
    const current = this.diaSelecionado
      ? new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), this.diaSelecionado)
      : new Date();
    const dow = current.getDay();
    const monday = new Date(current);
    monday.setDate(current.getDate() - (dow === 0 ? 6 : dow - 1));
    const hojeIso = hoje.toISOString().split('T')[0];
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    this.diasStrip = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        iso: d.toISOString().split('T')[0],
        num: d.getDate(),
        dow: nomes[d.getDay()],
        isHoje: d.toISOString().split('T')[0] === hojeIso,
      };
    });
  }

  selecionarDiaFromStrip(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    this.mesAtual = new Date(y, m - 1, 1);
    this.diaSelecionado = d;
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  temAtendimentoIso(iso: string): boolean {
    return this.atendimentos.some(a => a.data?.startsWith(iso));
  }

  prevDay() {
    const dia = this.diaSelecionado ?? new Date().getDate();
    const d = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), dia);
    d.setDate(d.getDate() - 1);
    this.mesAtual = new Date(d.getFullYear(), d.getMonth(), 1);
    this.diaSelecionado = d.getDate();
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  nextDay() {
    const dia = this.diaSelecionado ?? new Date().getDate();
    const d = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), dia);
    d.setDate(d.getDate() + 1);
    this.mesAtual = new Date(d.getFullYear(), d.getMonth(), 1);
    this.diaSelecionado = d.getDate();
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  goToHoje() {
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.diaSelecionado = hoje.getDate();
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  async openFormAtTime(horario: string) {
    const dataStr = this.diaSelecionado
      ? this.buildDataStr(this.diaSelecionado)
      : new Date().toISOString().split('T')[0];
    await this.openForm({ data: dataStr, horario } as Atendimento);
  }

  // ── Vista (lista / semana) ──────────────────────────
  vistaAtual: 'lista' | 'semana' = 'lista';
  diasSemanaAtual: { data: string; label: string; diaCurto: string; isHoje: boolean }[] = [];
  semanaLabel = '';

  toggleVista() {
    this.vistaAtual = this.vistaAtual === 'lista' ? 'semana' : 'lista';
    if (this.vistaAtual === 'semana') this.gerarSemanaAtual();
  }

  private gerarSemanaAtual() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const nomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const dias: { data: string; label: string; diaCurto: string; isHoje: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(segunda);
      d.setDate(segunda.getDate() + i);
      const data = d.toISOString().split('T')[0];
      dias.push({
        data,
        label: `${nomes[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`,
        diaCurto: nomes[d.getDay()] + '\n' + d.getDate(),
        isHoje: data === hoje.toISOString().split('T')[0],
      });
    }
    this.diasSemanaAtual = dias;
    const ini = dias[0].label.split(' ').slice(1).join(' ');
    const fim = dias[6].label.split(' ').slice(1).join(' ');
    this.semanaLabel = `${ini} – ${fim}`;
  }

  getAtendimentosDoDia(data: string): Atendimento[] {
    return this.atendimentos.filter(a => a.data?.startsWith(data));
  }

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

    // Escolhe forma de pagamento antes de confirmar
    const sheet = await this.actionSheetCtrl.create({
      header: `Forma de pagamento — R$ ${total.toFixed(2).replace('.', ',')}`,
      buttons: [
        ...this.formasPagamento.map(fp => ({
          text: fp,
          handler: () => {
            this.confirmarLote(itens, fp);
          },
        })),
        { text: 'Cancelar', role: 'cancel', icon: 'close-outline' },
      ],
    });
    await sheet.present();
  }

  private async confirmarLote(itens: Atendimento[], forma: FormaPagamento) {
    const total = itens.reduce((sum, a) => sum + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0), 0);
    const alert = await this.alertCtrl.create({
      header: `Dar baixa em ${itens.length} atendimento${itens.length > 1 ? 's' : ''}`,
      message: `Total: R$ ${total.toFixed(2).replace('.', ',')} via ${forma}. Confirmar e lançar no caixa?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.processarLote(itens, forma) },
      ],
    });
    await alert.present();
  }

  private async processarLote(itens: Atendimento[], forma: FormaPagamento = 'PIX') {
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
            forma_pagamento: forma,
            id_atendimento: a.id,
          }),
        ]);
      }));
      await this.showToast(`${itens.length} pagamento${itens.length > 1 ? 's' : ''} registrado${itens.length > 1 ? 's' : ''}! ✓`, 'success');
      this.cancelarSelecao();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
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
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // ── Pagamento ───────────────────────────────────────
  pagamentoAberto = false;
  atendimentoPagamento: Atendimento | null = null;
  descricaoPagamento = '';
  salvandoPagamento = false;
  formaPagamento: FormaPagamento = 'PIX';
  readonly formasPagamento = FORMAS_PAGAMENTO;

  get valorPagamento(): number {
    const a = this.atendimentoPagamento;
    return Number(a?.servico?.valor ?? 0) + Number(a?.valor_adicional ?? 0);
  }

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
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.diaSelecionado = hoje.getDate();
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.loadData();
    this.carregarStatusConcluido();
    this.updateNowTop();
    this.nowTimer = setInterval(() => this.updateNowTop(), 60000);
  }

  ngOnDestroy() {
    if (this.nowTimer) clearInterval(this.nowTimer);
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
          await this.showToast(errorMsg(e), 'danger');
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
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  nextMonth() {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
    this.diaSelecionado = null;
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.aplicarFiltros();
  }

  selecionarDia(dia: number) {
    this.diaSelecionado = dia;
    this.gerarDiasStrip();
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
        a.data?.includes(q) ||
        a.horario?.includes(q)
      );
    }

    // Ordena por data + horário (sem horário vai para o final do dia)
    this.atendimentosFiltrados = lista.sort((a, b) => {
      const ka = a.data + (a.horario ? 'T' + a.horario : 'T99:99');
      const kb = b.data + (b.horario ? 'T' + b.horario : 'T99:99');
      return ka.localeCompare(kb);
    });
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.atendimentos = await this.atendimentoService.getAll();
      this.aplicarFiltros();
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
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

  getDayOfWeek(d: string): string {
    if (!d) return '';
    const date = new Date(d + 'T12:00:00');
    return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][date.getDay()];
  }

  getDayNum(d: string): string {
    if (!d) return '';
    const [, , day] = d.split('-');
    return day;
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
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
    finally { await loading.dismiss(); }
  }

  // ── Pagamento ────────────────────────────────────────
  abrirPagamento(a: Atendimento) {
    this.atendimentoPagamento = a;
    const pet = a.animal?.nome || a.cliente?.nome || '';
    const servico = a.servico?.nome || 'Atendimento';
    this.descricaoPagamento = pet ? `${servico} — ${pet}` : servico;
    this.pagamentoAberto = true;
  }

  fecharPagamento() {
    this.pagamentoAberto = false;
    this.atendimentoPagamento = null;
    this.descricaoPagamento = '';
    this.formaPagamento = 'PIX';
  }

  async confirmarPagamento() {
    if (!this.atendimentoPagamento) return;
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
        forma_pagamento: this.formaPagamento,
        id_atendimento: this.atendimentoPagamento.id,
      });

      await this.showToast('Pagamento registrado no caixa! ✓', 'success');
      this.fecharPagamento();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
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
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
