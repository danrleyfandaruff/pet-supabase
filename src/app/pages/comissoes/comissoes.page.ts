import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { ResponsavelService } from '../../core/services/responsavel.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { Responsavel } from '../../core/models/responsavel.model';

interface ComissaoResponsavel {
  responsavel: Responsavel;
  atendimentos: Atendimento[];
  totalBruto: number;
  percentual: number;
  comissao: number;
}

@Component({
  selector: 'app-comissoes',
  templateUrl: './comissoes.page.html',
  styleUrls: ['./comissoes.page.scss'],
})
export class ComissoesPage implements OnInit {
  isLoading = false;

  // Mês selecionado
  mesAtual: string;
  mesesDisponiveis: { label: string; value: string }[] = [];

  responsaveis: Responsavel[] = [];
  comissoes: ComissaoResponsavel[] = [];

  // Percentuais configuráveis (armazenados localmente)
  percentuais: { [id: number]: number } = {};

  totalGeralBruto = 0;
  totalGeralComissao = 0;

  constructor(
    private atendimentoService: AtendimentoService,
    private responsavelService: ResponsavelService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    const hoje = new Date();
    this.mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    this.gerarMeses();
  }

  ngOnInit() { this.loadData(); }
  ionViewWillEnter() { this.loadData(); }

  private gerarMeses() {
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${meses[d.getMonth()]} ${d.getFullYear()}`;
      this.mesesDisponiveis.push({ label, value });
    }
  }

  private getPeriodoDatas(): { inicio: string; fim: string } {
    const [ano, mes] = this.mesAtual.split('-').map(Number);
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const proximoMes = new Date(ano, mes, 1);
    const fim = new Date(proximoMes.getTime() - 86400000).toISOString().split('T')[0];
    return { inicio, fim };
  }

  async changeMes(value: string) {
    this.mesAtual = value;
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const { inicio, fim } = this.getPeriodoDatas();
      const [responsaveis, atendimentos] = await Promise.all([
        this.responsavelService.getAllAtivos(),
        this.atendimentoService.getByPeriodo(inicio, fim),
      ]);

      this.responsaveis = responsaveis;

      // Inicializa percentuais padrão 30%
      for (const r of this.responsaveis) {
        if (r.id && !this.percentuais[r.id]) {
          this.percentuais[r.id] = 30;
        }
      }

      this.calcularComissoes(responsaveis, atendimentos);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  private calcularComissoes(responsaveis: Responsavel[], atendimentos: Atendimento[]) {
    this.comissoes = responsaveis
      .map(r => {
        const ats = atendimentos.filter(a => a.id_responsavel === r.id && a.pago);
        const totalBruto = ats.reduce(
          (s, a) => s + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0), 0
        );
        const percentual = r.id ? (this.percentuais[r.id] ?? 30) : 30;
        const comissao = totalBruto * (percentual / 100);
        return { responsavel: r, atendimentos: ats, totalBruto, percentual, comissao };
      })
      .filter(c => c.atendimentos.length > 0 || true); // mostra todos

    this.totalGeralBruto = this.comissoes.reduce((s, c) => s + c.totalBruto, 0);
    this.totalGeralComissao = this.comissoes.reduce((s, c) => s + c.comissao, 0);
  }

  async editarPercentual(item: ComissaoResponsavel) {
    const alert = await this.alertCtrl.create({
      header: `Comissão — ${item.responsavel.nome}`,
      inputs: [{
        name: 'percentual',
        type: 'number',
        placeholder: 'Ex: 30',
        value: String(item.percentual),
        min: 0,
        max: 100,
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (d) => {
            const pct = Math.min(100, Math.max(0, Number(d.percentual) || 0));
            if (item.responsavel.id) {
              this.percentuais[item.responsavel.id] = pct;
              item.percentual = pct;
              item.comissao = item.totalBruto * (pct / 100);
              this.totalGeralComissao = this.comissoes.reduce((s, c) => s + c.comissao, 0);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  formatCurrency(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  get labelMesAtual(): string {
    return this.mesesDisponiveis.find(m => m.value === this.mesAtual)?.label ?? this.mesAtual;
  }
}
