import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { AtendimentoFormComponent } from './atendimento-form.component';

@Component({
  selector: 'app-atendimentos',
  templateUrl: './atendimentos.page.html',
  styleUrls: ['./atendimentos.page.scss'],
})
export class AtendimentosPage implements OnInit {
  atendimentos: Atendimento[] = [];
  atendimentosFiltrados: Atendimento[] = [];
  isLoading = false;

  constructor(
    private atendimentoService: AtendimentoService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() { this.loadData(); }
  ionViewWillEnter() { this.loadData(); }

  async loadData() {
    this.isLoading = true;
    try {
      this.atendimentos = await this.atendimentoService.getAll();
      this.atendimentosFiltrados = [...this.atendimentos];
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.atendimentosFiltrados = this.atendimentos.filter(a =>
      a.animal?.nome?.toLowerCase().includes(q) ||
      a.cliente?.nome?.toLowerCase().includes(q) ||
      a.responsavel?.nome?.toLowerCase().includes(q) ||
      a.servico?.nome?.toLowerCase().includes(q) ||
      a.data?.includes(q)
    );
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

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
