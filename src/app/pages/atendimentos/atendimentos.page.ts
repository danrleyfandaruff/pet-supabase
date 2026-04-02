import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { AtendimentoFormComponent } from './atendimento-form.component';
import { StatusService } from '../../core/services/status.service';
import { Status } from '../../core/models/status.model';
import { FORMAS_PAGAMENTO, FormaPagamento } from '../../core/models/caixa.model';
import { AuthService } from '../../core/services/auth.service';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { Colaborador } from '../../core/models/colaborador.model';

type ColunaAgenda = {
  id: string | null;
  nome: string;
  comHorario: Atendimento[];
  semHorario: Atendimento[];
};

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimentos.page.html',
  styleUrls: ['./atendimentos.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosPage implements OnInit, OnDestroy {
  atendimentos: Atendimento[] = [];
  atendimentosFiltrados: Atendimento[] = [];
  isLoading = false;
  private ordemColunasAgenda: (string | null)[] | null = null;

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
  readonly SLOT_HEIGHT = 60; // px por hora (deve bater com $slot-h no SCSS)

  nowTop = 0;
  private nowTimer: any;
  diasStrip: { iso: string; num: number; dow: string; isHoje: boolean }[] = [];

  // ── Propriedades computadas (atualizadas só quando os dados mudam) ──────
  // Não são getters para evitar recálculo a cada ciclo de change detection
  atendimentosDoDia: Atendimento[] = [];
  isDiaSelecionadoHoje = false;
  diaSelecionadoLabel = '';
  private datasComAtendimento = new Set<string>();
  private atendimentosPorData = new Map<string, Atendimento[]>();

  private recalcularDia() {
    // isDiaSelecionadoHoje
    const hoje = new Date();
    this.isDiaSelecionadoHoje = !!this.diaSelecionado &&
      this.diaSelecionado === hoje.getDate() &&
      this.mesAtual.getMonth() === hoje.getMonth() &&
      this.mesAtual.getFullYear() === hoje.getFullYear();

    if (!this.diaSelecionado) {
      this.atendimentosDoDia = [];
      this.diaSelecionadoLabel = '';
      this.colunasAgenda = [];
      return;
    }

    // diaSelecionadoLabel
    const d = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), this.diaSelecionado);
    const DIAS  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    this.diaSelecionadoLabel = `${DIAS[d.getDay()]}, ${this.diaSelecionado} ${MESES[d.getMonth()]}`;

    // atendimentosDoDia
    const dataStr = this.buildDataStr(this.diaSelecionado);
    this.atendimentosDoDia = this.atendimentos
      .filter(a => a.data?.startsWith(dataStr))
      .sort((a, b) => (a.horario || '99:99').localeCompare(b.horario || '99:99'));

    // colunasAgenda
    this.recalcularColunas();
  }

  private normalizarNome(nome?: string | null): string {
    return (nome ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private recalcularColunas() {
    const atds = this.atendimentosDoDia;

    const splitCol = (lista: Atendimento[]) => ({
      comHorario: lista.filter(a => !!a.horario).sort((a, b) =>
        a.horario!.localeCompare(b.horario!)),
      semHorario: lista.filter(a => !a.horario),
    });

    // Atendimentos não vinculados a nenhum colaborador ativo
    const semColuna = (ids: Set<string>, lista: Atendimento[]) =>
      lista.filter(a => {
        const rNome = this.normalizarNome(a.colaborador?.nome ?? a.responsavel?.nome);
        return !rNome || !Array.from(ids).some(nome => nome === rNome);
      });

    if (!this.isAdmin) {
      // Colaborador: encontra a si mesmo pelo e-mail
      const userEmail = this.authService.currentUser?.email ?? '';
      const eu = this.colaboradores.find(c => c.email?.toLowerCase() === userEmail.toLowerCase());
      const meuNome = eu?.nome || this.authService.currentUser?.name || '';
      const meuNomeKey = this.normalizarNome(meuNome);
      const meus = atds.filter(a =>
        this.normalizarNome(a.colaborador?.nome ?? a.responsavel?.nome) === meuNomeKey
      );
      this.colunasAgenda = [{
        id: eu?.id ?? null,
        nome: meuNome,
        ...splitCol(meus),
      }];
      this.hasSemHorario = this.colunasAgenda.some(c => c.semHorario.length > 0);
      return;
    }

    // Admin: uma coluna por colaborador ativo + "Sem responsável" se necessário
    const colaboradoresAtivos = this.colaboradores.filter(c => c.ativo !== false);
    const nomesAtivos = new Set(colaboradoresAtivos.map(c => this.normalizarNome(c.nome)));

    let colunas: ColunaAgenda[] = colaboradoresAtivos
      .map(col => {
        const nomeKey = this.normalizarNome(col.nome);
        const lista = atds.filter(a =>
          this.normalizarNome(a.colaborador?.nome ?? a.responsavel?.nome) === nomeKey
        );
        return {
          id: col.id,
          nome: col.nome ?? '',
          ...splitCol(lista),
        };
      })
      .sort((a, b) => {
        const totalA = a.comHorario.length + a.semHorario.length;
        const totalB = b.comHorario.length + b.semHorario.length;
        if (totalB !== totalA) return totalB - totalA;
        return a.nome.localeCompare(b.nome);
      });

    // Coluna extra para atendimentos sem responsável ou com responsável fora dos colaboradores
    const semResp = semColuna(nomesAtivos, atds);
    if (semResp.length > 0) {
      colunas.push({ id: null, nome: 'Sem colaborador', ...splitCol(semResp) });
    }

    if (!this.ordemColunasAgenda) {
      this.ordemColunasAgenda = colunas.map(col => col.id);
    } else {
      const posicao = new Map(this.ordemColunasAgenda.map((id, index) => [id, index]));
      colunas = colunas.sort((a, b) => {
        const posA = posicao.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const posB = posicao.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (posA !== posB) return posA - posB;
        return a.nome.localeCompare(b.nome);
      });
    }

    this.colunasAgenda = colunas;
    this.hasSemHorario = this.colunasAgenda.some(c => c.semHorario.length > 0);
  }

  private updateNowTop() {
    const now = new Date();
    this.nowTop = Math.max(0, (now.getHours() * 60 + now.getMinutes() - this.GRID_START_HOUR * 60) / 60 * this.SLOT_HEIGHT);
    this.cdr.markForCheck();
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
    return this.datasComAtendimento.has(iso);
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
    return this.atendimentosPorData.get(data) ?? [];
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
      const payload = itens.map(a => {
        const pet     = a.animal?.nome || a.cliente?.nome || '';
        const servico = a.servico?.nome || 'Atendimento';
        return {
          id: a.id!,
          forma_pagamento: forma,
          descricao: pet ? `${servico} — ${pet}` : servico,
        };
      });

      const resultado = await this.atendimentoService.darBaixaLote(payload);

      const total = resultado.sucesso;
      const falhas = resultado.erros.length;
      if (falhas > 0) {
        const motivos = resultado.erros.map(e => e.motivo).join('; ');
        await this.showToast(`${total} pago(s). ${falhas} falha(s): ${motivos}`, 'warning');
      } else {
        await this.showToast(`${total} pagamento${total > 1 ? 's' : ''} registrado${total > 1 ? 's' : ''}! ✓`, 'success');
      }
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

  temValor(a: Atendimento): boolean {
    return (Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0)) > 0;
  }

  // ── Timeline: grid de horários ──────────────────────────
  @ViewChild('timelineScroll') timelineScrollRef!: ElementRef<HTMLElement>;
  @ViewChild('timelineBody') timelineBodyRef!: ElementRef<HTMLElement>;
  @ViewChildren('timelineCol') timelineCols!: QueryList<ElementRef<HTMLElement>>;

  getEventTop(horario: string): number {
    const [h, m] = horario.split(':').map(Number);
    return Math.max(0, (h * 60 + m - this.GRID_START_HOUR * 60) / 60 * this.SLOT_HEIGHT);
  }

  async openFormAtTimeAndCol(horario: string, col: ColunaAgenda) {
    const dataStr = this.diaSelecionado
      ? this.buildDataStr(this.diaSelecionado)
      : new Date().toISOString().split('T')[0];
    await this.openForm({ data: dataStr, horario, id_colaborador: col.id ?? undefined } as Atendimento);
  }

  scrollToColuna(colIndex: number) {
    const scrollEl = this.timelineScrollRef?.nativeElement;
    const colEl = this.timelineCols?.toArray()?.[colIndex]?.nativeElement;
    if (!scrollEl || !colEl) return;

    const targetLeft = Math.max(0, colEl.offsetLeft - 12);
    scrollEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }

  // ── Drag & Drop (tempo + coluna/profissional) ────────────
  private _suppressNextClick = false;

  dragState: {
    active: boolean;
    id: number | null;
    sourceColIndex: number;
    startPointerX: number;
    startPointerY: number;
    startEventTop: number;
    ghostTop: number;
    ghostColIndex: number;
    movedEnough: boolean;
  } = { active: false, id: null, sourceColIndex: 0, startPointerX: 0, startPointerY: 0, startEventTop: 0, ghostTop: 0, ghostColIndex: 0, movedEnough: false };

  get ghostLeft(): number {
    const cols = this.timelineCols?.toArray();
    const col = cols?.[this.dragState.ghostColIndex];
    if (!col || !this.timelineBodyRef) return 0;
    const bodyRect = this.timelineBodyRef.nativeElement.getBoundingClientRect();
    return col.nativeElement.getBoundingClientRect().left - bodyRect.left;
  }

  get ghostWidth(): number {
    const cols = this.timelineCols?.toArray();
    return cols?.[this.dragState.ghostColIndex]?.nativeElement.getBoundingClientRect().width ?? 0;
  }

  get snappedGhostHorario(): string {
    const totalMinutes = this.GRID_START_HOUR * 60 + (this.dragState.ghostTop / this.SLOT_HEIGHT) * 60;
    const snapped = Math.round(totalMinutes / 15) * 15;
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  onDragStart(e: PointerEvent, a: Atendimento, colIndex: number) {
    if (!a.horario) return;
    e.preventDefault();
    e.stopPropagation();
    // Captura no body para receber move/up mesmo fora do bloco
    this.timelineBodyRef?.nativeElement.setPointerCapture(e.pointerId);
    const top = this.getEventTop(a.horario);
    this.dragState = {
      active: true, id: a.id!,
      sourceColIndex: colIndex,
      startPointerX: e.clientX, startPointerY: e.clientY,
      startEventTop: top, ghostTop: top,
      ghostColIndex: colIndex, movedEnough: false,
    };
  }

  onDragMove(e: PointerEvent) {
    if (!this.dragState.active) return;
    e.preventDefault();
    const deltaY = e.clientY - this.dragState.startPointerY;
    const deltaX = Math.abs(e.clientX - this.dragState.startPointerX);
    const newTop = Math.max(0, this.dragState.startEventTop + deltaY);

    // Detecta qual coluna o ponteiro está sobre
    let targetCol = this.dragState.ghostColIndex;
    const cols = this.timelineCols?.toArray();
    if (cols?.length) {
      for (let i = 0; i < cols.length; i++) {
        const rect = cols[i].nativeElement.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX < rect.right) { targetCol = i; break; }
      }
    }

    this.dragState = {
      ...this.dragState,
      ghostTop: newTop,
      ghostColIndex: targetCol,
      movedEnough: Math.abs(deltaY) > 8 || deltaX > 12,
    };
    this.cdr.markForCheck();
  }

  async onDragEnd(e: PointerEvent) {
    if (!this.dragState.active) return;
    const { ghostTop, id, ghostColIndex, sourceColIndex, movedEnough } = this.dragState;
    this.dragState = { active: false, id: null, sourceColIndex: 0, startPointerX: 0, startPointerY: 0, startEventTop: 0, ghostTop: 0, ghostColIndex: 0, movedEnough: false };

    if (movedEnough) {
      this._suppressNextClick = true;
      setTimeout(() => { this._suppressNextClick = false; }, 300);
    }
    if (!id || !movedEnough) { this.cdr.markForCheck(); return; }

    // Snap para grade de 15 min
    const slotPx = this.SLOT_HEIGHT / 4;
    const snappedTop = Math.round(ghostTop / slotPx) * slotPx;
    const totalMinutes = this.GRID_START_HOUR * 60 + (snappedTop / this.SLOT_HEIGHT) * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h < 7 || h > 22) { this.cdr.markForCheck(); return; }

    const newHorario = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const newColuna = this.colunasAgenda[ghostColIndex];
    const atend = this.atendimentos.find(x => x.id === id);
    if (!atend) return;

    const horarioChanged = newHorario !== atend.horario;
    const colunaChanged = ghostColIndex !== sourceColIndex;
    if (!horarioChanged && !colunaChanged) { this.cdr.markForCheck(); return; }

    // Atualização otimista
    const oldHorario = atend.horario;
    const oldColaboradorId = atend.id_colaborador;
    const oldColaboradorNome = atend.colaborador?.nome ?? atend.responsavel?.nome;

    atend.horario = newHorario;
    if (colunaChanged && newColuna) {
      atend.id_colaborador = newColuna.id ?? undefined;
      if (atend.colaborador) atend.colaborador.nome = newColuna.nome;
      else (atend as any).colaborador = { nome: newColuna.nome };
      if (atend.responsavel) atend.responsavel.nome = newColuna.nome;
    }
    this.atendimentos = [...this.atendimentos];
    this.aplicarFiltros();

    try {
      const updates: any = {};
      if (horarioChanged) updates.horario = newHorario;
      if (colunaChanged) {
        updates.id_colaborador = newColuna?.id ?? null;
      }
      await this.atendimentoService.update(id, updates);
      const partes = [
        horarioChanged ? `Horário → ${newHorario}` : '',
        colunaChanged ? `Profissional → ${newColuna?.nome}` : '',
      ].filter(Boolean).join(' · ');
      await this.showToast(`${partes} ✓`, 'success');
    } catch (err: any) {
      atend.horario = oldHorario;
      atend.id_colaborador = oldColaboradorId;
      if (atend.colaborador) atend.colaborador.nome = oldColaboradorNome ?? '';
      if (atend.responsavel) atend.responsavel.nome = oldColaboradorNome ?? '';
      this.atendimentos = [...this.atendimentos];
      this.aplicarFiltros();
      await this.showToast(errorMsg(err), 'danger');
    }
  }

  onDragCancel() {
    this.dragState.active = false;
    this.cdr.markForCheck();
  }

  onEventClick(a: Atendimento, e?: Event) {
    if (this._suppressNextClick) return;
    this.openForm(a);
  }

  // Lista e ID de status (carregados no init)
  private statusConcluidoId: number | null = null;
  statusList: Status[] = [];

  // ── Vista colunas por colaborador ───────────────────────
  colaboradores: Colaborador[] = [];

  colunasAgenda: ColunaAgenda[] = [];
  hasSemHorario = false;

  private readonly AVATAR_COLORS = [
    '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
    '#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4'
  ];

  get isAdmin(): boolean {
    return this.authService.currentUser?.perfil === 'admin';
  }

  getAvatarColor(nome: string): string {
    let hash = 0;
    for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  getInitials(nome: string): string {
    return nome.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
  }

  constructor(
    private atendimentoService: AtendimentoService,
    private statusService: StatusService,
    private authService: AuthService,
    private colaboradorService: ColaboradorService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.diaSelecionado = hoje.getDate();
    this.gerarCalendario();
    this.gerarDiasStrip();
    this.carregarColaboradores();
    this.loadData();
    this.carregarStatusConcluido();
    this.updateNowTop();
    this.nowTimer = setInterval(() => this.updateNowTop(), 60000);
  }

  private async carregarColaboradores() {
    try {
      const cols = await this.colaboradorService.getAll();
      this.colaboradores = cols;
      this.recalcularColunas();
      this.cdr.markForCheck();
    } catch (_) {}
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
      this.cdr.markForCheck();
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
    return this.datasComAtendimento.has(this.buildDataStr(dia));
  }

  private buildDataStr(dia: number): string {
    const ano = this.mesAtual.getFullYear();
    const mes = String(this.mesAtual.getMonth() + 1).padStart(2, '0');
    const d = String(dia).padStart(2, '0');
    return `${ano}-${mes}-${d}`;
  }

  private aplicarFiltros() {
    // ── Índice por data para lookups O(1) ──────────────────
    this.datasComAtendimento = new Set(
      this.atendimentos.map(a => a.data?.slice(0, 10) ?? '')
    );

    // ── Cache de atendimentos por data (view semana) ────────
    this.atendimentosPorData = new Map();
    for (const a of this.atendimentos) {
      const chave = a.data?.slice(0, 10) ?? '';
      if (!this.atendimentosPorData.has(chave)) this.atendimentosPorData.set(chave, []);
      this.atendimentosPorData.get(chave)!.push(a);
    }

    // ── Recomputa propriedades do dia selecionado ───────────
    this.recalcularDia();

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
        a.colaborador?.nome?.toLowerCase().includes(q) ||
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

    this.cdr.markForCheck();
  }

  async loadData() {
    this.isLoading = true;
    this.ordemColunasAgenda = null;
    this.cdr.markForCheck();
    try {
      this.atendimentos = await this.atendimentoService.getAll();
      this.aplicarFiltros();
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
    finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
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
      await this.atendimentoService.darBaixa(this.atendimentoPagamento.id!, {
        forma_pagamento: this.formaPagamento,
        descricao: this.descricaoPagamento,
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
      await this.atendimentoService.desfazerBaixa(a.id!);
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
