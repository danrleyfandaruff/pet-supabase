import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { CaixaService } from '../../core/services/caixa.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { Caixa } from '../../core/models/caixa.model';
import { errorMsg } from '../../core/utils/error.utils';

interface RankingItem {
  nome: string;
  total: number;
  quantidade: number;
}

interface DiaReceita {
  label: string; // 'dd/MM'
  valor: number;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
})
export class RelatoriosPage implements OnInit {
  @ViewChild('faturamentoCanvas') faturamentoCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('servicosCanvas') servicosCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clientesCanvas') clientesCanvasRef?: ElementRef<HTMLCanvasElement>;

  periodos = [
    { label: 'Esta semana', value: '7d' },
    { label: 'Este mês', value: '30d' },
    { label: 'Últimos 3 meses', value: '90d' },
    { label: 'Este ano', value: '365d' },
  ];
  periodoSelecionado = '30d';

  isLoading = false;

  // Métricas
  totalReceita = 0;
  totalAtendimentos = 0;
  totalPagos = 0;
  ticketMedio = 0;
  totalDespesas = 0;
  lucroLiquido = 0;

  // Rankings
  topServicos: RankingItem[] = [];
  topClientes: RankingItem[] = [];

  // Dados dos gráficos
  faturamentoDias: DiaReceita[] = [];

  constructor(
    private atendimentoService: AtendimentoService,
    private caixaService: CaixaService,
    private ngZone: NgZone,
  ) {}

  ngOnInit() { this.loadData(); }
  ionViewWillEnter() { this.loadData(); }

  async changePeriodo(valor: string) {
    this.periodoSelecionado = valor;
    await this.loadData();
  }

  private getPeriodoDatas(): { inicio: string; fim: string } {
    const hoje = new Date();
    const fim = hoje.toISOString().split('T')[0];
    const dias = parseInt(this.periodoSelecionado);
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - dias);
    return { inicio: inicio.toISOString().split('T')[0], fim };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const { inicio, fim } = this.getPeriodoDatas();
      const [atendimentos, caixaEntries] = await Promise.all([
        this.atendimentoService.getByPeriodo(inicio, fim),
        this.caixaService.getByPeriodo(inicio, fim),
      ]);

      this.calcularMetricas(atendimentos, caixaEntries);
      this.calcularFaturamentoPorDia(caixaEntries, inicio, fim);
      this.calcularTopServicos(atendimentos);
      this.calcularTopClientes(atendimentos);

      // Desenha os gráficos fora da zona do Angular para não disparar
      // change detection em loop — aguarda o DOM renderizar primeiro.
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.drawAllCharts(), 80);
      });
    } catch (e: unknown) {
      console.error(errorMsg(e));
    } finally {
      this.isLoading = false;
    }
  }

  private calcularMetricas(ats: Atendimento[], caixa: Caixa[]) {
    this.totalAtendimentos = ats.length;
    const pagos = ats.filter(a => a.pago);
    this.totalPagos = pagos.length;
    this.totalReceita = caixa
      .filter(c => c.tipo === 'entrada')
      .reduce((s, c) => s + Number(c.valor), 0);
    this.totalDespesas = caixa
      .filter(c => c.tipo === 'saida')
      .reduce((s, c) => s + Number(c.valor), 0);
    this.lucroLiquido = this.totalReceita - this.totalDespesas;
    this.ticketMedio = this.totalPagos > 0
      ? this.totalReceita / this.totalPagos
      : 0;
  }

  private calcularFaturamentoPorDia(caixa: Caixa[], inicio: string, fim: string) {
    // Agrupa entradas por data
    const map = new Map<string, number>();
    for (const c of caixa) {
      if (c.tipo !== 'entrada' || !c.data) continue;
      const data = c.data.split('T')[0];
      map.set(data, (map.get(data) ?? 0) + Number(c.valor));
    }

    // Gera todos os dias do período (limita a 31 para legibilidade)
    const dias: DiaReceita[] = [];
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    const totalDias = Math.round((dataFim.getTime() - dataInicio.getTime()) / 86400000) + 1;
    const passo = totalDias > 31 ? Math.ceil(totalDias / 31) : 1;

    const cur = new Date(dataInicio);
    while (cur <= dataFim) {
      const key = cur.toISOString().split('T')[0];
      const label = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
      dias.push({ label, valor: map.get(key) ?? 0 });
      cur.setDate(cur.getDate() + passo);
    }

    this.faturamentoDias = dias;
  }

  private calcularTopServicos(ats: Atendimento[]) {
    const map = new Map<string, { total: number; quantidade: number }>();
    for (const a of ats) {
      if (!a.pago) continue;
      const nome = a.servico?.nome || a.pacote?.nome || 'Sem serviço';
      const valor = Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0);
      const atual = map.get(nome) ?? { total: 0, quantidade: 0 };
      map.set(nome, { total: atual.total + valor, quantidade: atual.quantidade + 1 });
    }
    this.topServicos = Array.from(map.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6);
  }

  private calcularTopClientes(ats: Atendimento[]) {
    const map = new Map<string, { total: number; quantidade: number }>();
    for (const a of ats) {
      if (!a.pago) continue;
      const nome = a.cliente?.nome || 'Sem cliente';
      const valor = Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0);
      const atual = map.get(nome) ?? { total: 0, quantidade: 0 };
      map.set(nome, { total: atual.total + valor, quantidade: atual.quantidade + 1 });
    }
    this.topClientes = Array.from(map.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }

  // ── Gráficos Canvas ───────────────────────────────────────

  private drawAllCharts() {
    this.drawLineChart();
    this.drawBarChart(
      this.servicosCanvasRef,
      this.topServicos.map(s => ({ label: s.nome, valor: s.quantidade })),
      '#4c8dff',
      '#84a9ff',
    );
    this.drawBarChart(
      this.clientesCanvasRef,
      this.topClientes.map(c => ({ label: c.nome, valor: c.total })),
      '#9b59b6',
      '#c39bd3',
      true,
    );
  }

  private drawLineChart() {
    const ref = this.faturamentoCanvasRef;
    if (!ref) return;
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const dados = this.faturamentoDias;
    if (dados.length === 0) return;

    const padL = 54, padR = 16, padT = 16, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const maxVal = Math.max(...dados.map(d => d.valor), 1);

    const xOf = (i: number) => padL + (i / (dados.length - 1 || 1)) * plotW;
    const yOf = (v: number) => padT + plotH - (v / maxVal) * plotH;

    // Grid lines
    ctx.strokeStyle = '#e8eaf0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const val = maxVal * (1 - i / 4);
      ctx.fillStyle = '#999';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(this.shortCurrency(val), padL - 4, y + 4);
    }

    // Área de gradiente
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,141,255,0.25)');
    grad.addColorStop(1, 'rgba(76,141,255,0)');

    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(dados[0].valor));
    for (let i = 1; i < dados.length; i++) {
      const xPrev = xOf(i - 1), yPrev = yOf(dados[i - 1].valor);
      const xCur = xOf(i), yCur = yOf(dados[i].valor);
      const cpX = (xPrev + xCur) / 2;
      ctx.bezierCurveTo(cpX, yPrev, cpX, yCur, xCur, yCur);
    }
    ctx.lineTo(xOf(dados.length - 1), padT + plotH);
    ctx.lineTo(xOf(0), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Linha
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(dados[0].valor));
    for (let i = 1; i < dados.length; i++) {
      const xPrev = xOf(i - 1), yPrev = yOf(dados[i - 1].valor);
      const xCur = xOf(i), yCur = yOf(dados[i].valor);
      const cpX = (xPrev + xCur) / 2;
      ctx.bezierCurveTo(cpX, yPrev, cpX, yCur, xCur, yCur);
    }
    ctx.strokeStyle = '#4c8dff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Labels eixo X (exibe no máx 7)
    const step = Math.ceil(dados.length / 7);
    ctx.fillStyle = '#888';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    for (let i = 0; i < dados.length; i += step) {
      ctx.fillText(dados[i].label, xOf(i), H - padB + 14);
    }
    ctx.fillText(dados[dados.length - 1].label, xOf(dados.length - 1), H - padB + 14);
  }

  private drawBarChart(
    ref: ElementRef<HTMLCanvasElement> | undefined,
    dados: { label: string; valor: number }[],
    colorA: string,
    colorB: string,
    isCurrency = false,
  ) {
    if (!ref || dados.length === 0) return;
    const canvas = ref.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 4, padR = 56, padT = 10, padB = 10;
    const barH = (H - padT - padB) / dados.length;
    const gap = barH * 0.25;
    const actualBarH = barH - gap;
    const maxVal = Math.max(...dados.map(d => d.valor), 1);
    const plotW = W - padL - padR;

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);

    dados.forEach((item, i) => {
      const y = padT + i * barH + gap / 2;
      const barW = (item.valor / maxVal) * plotW;

      // Background bar
      ctx.fillStyle = '#f0f2f5';
      ctx.beginPath();
      ctx.roundRect(padL, y, plotW, actualBarH, 4);
      ctx.fill();

      // Filled bar
      if (barW > 0) {
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(padL, y, Math.max(barW, 6), actualBarH, 4);
        ctx.fill();
      }

      // Label à direita
      const label = isCurrency ? this.shortCurrency(item.valor) : `${item.valor}x`;
      ctx.fillStyle = '#333';
      ctx.font = `bold 11px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(label, padL + plotW + 6, y + actualBarH / 2 + 4);

      // Nome truncado dentro da barra (ou acima se barra pequena)
      const truncated = item.label.length > 14 ? item.label.slice(0, 13) + '…' : item.label;
      ctx.fillStyle = barW > 60 ? '#fff' : '#555';
      ctx.font = `10px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(truncated, padL + 6, y + actualBarH / 2 + 4);
    });
  }

  private shortCurrency(val: number): string {
    if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
    return `R$${val.toFixed(0)}`;
  }

  get semDados(): boolean {
    return this.totalAtendimentos === 0 && this.faturamentoDias.every(d => d.valor === 0);
  }

  formatCurrency(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  maxTopServico(): number {
    return this.topServicos.length > 0 ? this.topServicos[0].total : 1;
  }

  maxTopCliente(): number {
    return this.topClientes.length > 0 ? this.topClientes[0].total : 1;
  }
}
