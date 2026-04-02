import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { Colaborador } from '../../core/models/colaborador.model';

interface ComissaoColaborador {
  colaborador: Colaborador;
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

  colaboradores: Colaborador[] = [];
  comissoes: ComissaoColaborador[] = [];

  // Percentuais configuráveis (armazenados localmente)
  percentuais: { [id: string]: number } = {};

  totalGeralBruto = 0;
  totalGeralComissao = 0;

  constructor(
    private atendimentoService: AtendimentoService,
    private colaboradorService: ColaboradorService,
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
      const [colaboradores, atendimentos] = await Promise.all([
        this.colaboradorService.getAll(),
        this.atendimentoService.getByPeriodo(inicio, fim),
      ]);

      this.colaboradores = colaboradores.filter(c => c.ativo !== false);

      // Inicializa percentuais padrão 30%
      for (const c of this.colaboradores) {
        if (c.id && !this.percentuais[c.id]) {
          this.percentuais[c.id] = 30;
        }
      }

      this.calcularComissoes(this.colaboradores, atendimentos);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  private calcularComissoes(colaboradores: Colaborador[], atendimentos: Atendimento[]) {
    this.comissoes = colaboradores
      .map(c => {
        const ats = atendimentos.filter(a => a.id_colaborador === c.id && a.pago);
        const totalBruto = ats.reduce(
          (s, a) => s + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0), 0
        );
        const percentual = c.id ? (this.percentuais[c.id] ?? 30) : 30;
        const comissao = totalBruto * (percentual / 100);
        return { colaborador: c, atendimentos: ats, totalBruto, percentual, comissao };
      })
      .filter(c => c.atendimentos.length > 0 || true); // mostra todos

    this.totalGeralBruto = this.comissoes.reduce((s, c) => s + c.totalBruto, 0);
    this.totalGeralComissao = this.comissoes.reduce((s, c) => s + c.comissao, 0);
  }

  async editarPercentual(item: ComissaoColaborador) {
    const alert = await this.alertCtrl.create({
      header: `Comissão — ${item.colaborador.nome}`,
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
            if (item.colaborador.id) {
              this.percentuais[item.colaborador.id] = pct;
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
