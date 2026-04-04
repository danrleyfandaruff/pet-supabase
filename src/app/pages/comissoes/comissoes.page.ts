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
  totalAdicionais: number;
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
        const totalServicos = ats.reduce((s, a) => s + Number(a.servico?.valor ?? 0), 0);
        const totalAdicionais = ats.reduce((s, a) => s + Number(a.valor_adicional ?? 0), 0);
        const totalBruto = totalServicos + totalAdicionais;
        const percentual = Number(c.percentual_comissao_padrao ?? 30);
        const comissao = ats.reduce((s, a) => s + this.calcularComissaoAtendimento(a, c), 0);
        return { colaborador: c, atendimentos: ats, totalBruto, totalAdicionais, percentual, comissao };
      })
      .filter(c => c.atendimentos.length > 0 || true); // mostra todos

    this.totalGeralBruto = this.comissoes.reduce((s, c) => s + c.totalBruto, 0);
    this.totalGeralComissao = this.comissoes.reduce((s, c) => s + c.comissao, 0);
  }

  private getPercentualServico(atendimento: Atendimento, colaborador: Colaborador): number {
    const tipo = (atendimento.servico?.tipo_servico?.nome ?? atendimento.servico?.nome ?? '').toLowerCase();
    if (tipo.includes('banho')) {
      return Number(colaborador.percentual_comissao_banho ?? colaborador.percentual_comissao_padrao ?? 30);
    }
    if (tipo.includes('tosa')) {
      return Number(colaborador.percentual_comissao_tosa ?? colaborador.percentual_comissao_padrao ?? 30);
    }
    return Number(colaborador.percentual_comissao_padrao ?? 30);
  }

  private calcularComissaoAtendimento(atendimento: Atendimento, colaborador: Colaborador): number {
    const valorServico = Number(atendimento.servico?.valor ?? 0);
    const valorAdicional = Number(atendimento.valor_adicional ?? 0);
    const percentualServico = this.getPercentualServico(atendimento, colaborador);
    const percentualAdicional = Number(colaborador.percentual_comissao_adicional ?? colaborador.percentual_comissao_padrao ?? 30);

    return (valorServico * (percentualServico / 100)) + (valorAdicional * (percentualAdicional / 100));
  }

  async editarPercentual(item: ComissaoColaborador) {
    const alert = await this.alertCtrl.create({
      header: `Comissão — ${item.colaborador.nome}`,
      inputs: [
        {
          name: 'padrao',
          type: 'number',
          placeholder: 'Ex: 30',
          value: String(item.colaborador.percentual_comissao_padrao ?? 30),
          min: 0,
          max: 100,
        },
        {
          name: 'banho',
          type: 'number',
          placeholder: 'Opcional',
          value: item.colaborador.percentual_comissao_banho == null ? '' : String(item.colaborador.percentual_comissao_banho),
          min: 0,
          max: 100,
        },
        {
          name: 'tosa',
          type: 'number',
          placeholder: 'Opcional',
          value: item.colaborador.percentual_comissao_tosa == null ? '' : String(item.colaborador.percentual_comissao_tosa),
          min: 0,
          max: 100,
        },
        {
          name: 'adicional',
          type: 'number',
          placeholder: 'Ex: 30',
          value: String(item.colaborador.percentual_comissao_adicional ?? 30),
          min: 0,
          max: 100,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: async (d) => {
            const padrao = Math.min(100, Math.max(0, Number(d.padrao) || 0));
            const banho = d.banho === '' ? null : Math.min(100, Math.max(0, Number(d.banho) || 0));
            const tosa = d.tosa === '' ? null : Math.min(100, Math.max(0, Number(d.tosa) || 0));
            const adicional = Math.min(100, Math.max(0, Number(d.adicional) || 0));

            try {
              if (item.colaborador.id) {
                await this.colaboradorService.updateConfiguracoes(item.colaborador.id, {
                  avatar_url: item.colaborador.avatar_url ?? null,
                  percentual_comissao_padrao: padrao,
                  percentual_comissao_banho: banho,
                  percentual_comissao_tosa: tosa,
                  percentual_comissao_adicional: adicional,
                });
                await this.loadData();
              }
            } catch (e) {
              console.error(e);
              const toast = await this.toastCtrl.create({
                message: 'Não foi possível salvar as regras de comissão.',
                color: 'danger',
                duration: 2500,
                position: 'top',
              });
              await toast.present();
            }
            return true;
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

  getAvatarLabel(colaborador: Colaborador): string {
    return (colaborador.nome || colaborador.email || '?').charAt(0).toUpperCase();
  }
}
