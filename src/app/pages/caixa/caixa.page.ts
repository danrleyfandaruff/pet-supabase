import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CaixaService } from '../../core/services/caixa.service';
import { Caixa, TipoCaixa } from '../../core/models/caixa.model';

@Component({
  selector: 'app-caixa',
  templateUrl: './caixa.page.html',
  styleUrls: ['./caixa.page.scss'],
})
export class CaixaPage implements OnInit {
  registros: Caixa[] = [];
  registrosFiltrados: Caixa[] = [];
  isLoading = false;

  // resumo
  totalEntradas = 0;
  totalSaidas = 0;
  saldo = 0;

  // filtro de período
  periodoAtivo: 'mes' | 'semana' | 'todos' = 'mes';

  // gráfico mensal
  dadosMensais: { mes: string; entradas: number; saidas: number }[] = [];
  graficoMax = 1;
  graficoLoading = false;

  // modal de lançamento
  modalAberto = false;
  tipoForm: TipoCaixa = 'entrada';
  salvando = false;
  form!: FormGroup;

  constructor(
    private caixaService: CaixaService,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadData();
    this.carregarGrafico();
  }

  ionViewWillEnter() {
    this.loadData();
    this.carregarGrafico();
  }

  private buildForm() {
    this.form = this.fb.group({
      descricao: ['', Validators.required],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [this.hoje(), Validators.required],
      categoria: [''],
    });
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.registros = await this.caixaService.getAllOrdenado();
      this.aplicarFiltro();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  onPeriodoChange() { this.aplicarFiltro(); }

  private aplicarFiltro() {
    const hoje = new Date();
    let lista: Caixa[];

    if (this.periodoAtivo === 'mes') {
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      lista = this.registros.filter(r => r.data?.startsWith(`${ano}-${mes}`));
    } else if (this.periodoAtivo === 'semana') {
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      lista = this.registros.filter(r => {
        const d = new Date(r.data + 'T00:00:00');
        return d >= inicioSemana;
      });
    } else {
      lista = [...this.registros];
    }

    this.registrosFiltrados = lista;
    this.calcularResumo(lista);
  }

  private calcularResumo(lista: Caixa[]) {
    this.totalEntradas = lista
      .filter(r => r.tipo === 'entrada')
      .reduce((acc, r) => acc + Number(r.valor), 0);
    this.totalSaidas = lista
      .filter(r => r.tipo === 'saida')
      .reduce((acc, r) => acc + Number(r.valor), 0);
    this.saldo = this.totalEntradas - this.totalSaidas;
  }

  abrirForm(tipo: TipoCaixa) {
    this.tipoForm = tipo;
    this.form.reset({ data: this.hoje(), descricao: '', valor: null, categoria: '' });
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
  }

  async salvar() {
    if (this.form.invalid) return;
    this.salvando = true;
    try {
      const payload: Partial<Caixa> = {
        tipo: this.tipoForm,
        descricao: this.form.value.descricao,
        valor: Number(this.form.value.valor),
        data: this.form.value.data,
        categoria: this.form.value.categoria || undefined,
      };
      await this.caixaService.create(payload);
      await this.showToast('Lançamento salvo!', 'success');
      this.fecharModal();
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      this.salvando = false;
    }
  }

  async confirmDelete(item: Caixa) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir lançamento',
      message: `Excluir "${item.descricao}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(item) },
      ],
    });
    await alert.present();
  }

  async delete(item: Caixa) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.caixaService.delete(item.id!);
      await this.showToast('Lançamento excluído!', 'success');
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async carregarGrafico() {
    this.graficoLoading = true;
    try {
      this.dadosMensais = await this.caixaService.getMensal(6);
      const maxVal = Math.max(...this.dadosMensais.map(d => Math.max(d.entradas, d.saidas)));
      this.graficoMax = maxVal > 0 ? maxVal : 1;
    } catch { /* silently skip */ }
    finally { this.graficoLoading = false; }
  }

  barHeight(value: number): number {
    return Math.round((value / this.graficoMax) * 100);
  }

  formatDate(d: string): string {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  private hoje(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
