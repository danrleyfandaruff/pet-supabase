import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { AquisicaoPacote } from '../../core/models/aquisicao-pacote.model';
import { AquisicaoPacoteFormComponent } from './aquisicao-pacote-form.component';

@Component({
  selector: 'app-aquisicao-pacotes',
  templateUrl: './aquisicao-pacotes.page.html',
  styleUrls: ['./aquisicao-pacotes.page.scss'],
})
export class AquisicaoPacotesPage implements OnInit {
  aquisicoes: AquisicaoPacote[] = [];
  aquisicoesFiltradas: AquisicaoPacote[] = [];
  isLoading = false;

  constructor(
    private aquisicaoService: AquisicaoPacoteService,
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
      this.aquisicoes = await this.aquisicaoService.getAll();
      this.aquisicoesFiltradas = [...this.aquisicoes];
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.aquisicoesFiltradas = this.aquisicoes.filter(a =>
      a.pacote?.nome?.toLowerCase().includes(q) ||
      a.animal?.nome?.toLowerCase().includes(q)
    );
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  async openForm(aquisicao?: AquisicaoPacote) {
    const modal = await this.modalCtrl.create({
      component: AquisicaoPacoteFormComponent,
      componentProps: { aquisicao },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(aquisicao: AquisicaoPacote) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir aquisição',
      message: `Deseja excluir a aquisição do pacote "${aquisicao.pacote?.nome || ''}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(aquisicao) },
      ],
    });
    await alert.present();
  }

  async delete(aquisicao: AquisicaoPacote) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.aquisicaoService.delete(aquisicao.id!);
      await this.showToast('Aquisição excluída!', 'success');
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally { await loading.dismiss(); }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
