import { Component, OnInit } from '@angular/core';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { CaixaService } from '../../core/services/caixa.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { Caixa } from '../../core/models/caixa.model';

interface RankingItem {
  nome: string;
  total: number;
  quantidade: number;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.page.html',
  styleUrls: ['./relatorios.page.scss'],
})
export class RelatoriosPage implements OnInit {
  // Período selecionado
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

  constructor(
    private atendimentoService: AtendimentoService,
    private caixaService: CaixaService,
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
      this.calcularTopServicos(atendimentos);
      this.calcularTopClientes(atendimentos);
    } catch (e) {
      console.error(e);
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
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
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
      .slice(0, 5);
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
