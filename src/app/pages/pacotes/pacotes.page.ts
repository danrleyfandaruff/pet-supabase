import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { PacoteService } from '../../core/services/pacote.service';
import { Pacote } from '../../core/models/pacote.model';
import { PacoteFormComponent } from './pacote-form.component';

@Component({ selector: 'app-pacotes', templateUrl: './pacotes.page.html', styleUrls: ['./pacotes.page.scss'] })
export class PacotesPage implements OnInit {
  pacotes: Pacote[] = [];
  pacotesFiltrados: Pacote[] = [];
  isLoading = false;

  constructor(
    private pacoteService: PacoteService,
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
      this.pacotes = await this.pacoteService.getAll();
      this.pacotesFiltrados = [...this.pacotes];
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.pacotesFiltrados = this.pacotes.filter(p => p.nome.toLowerCase().includes(q));
  }

  async openForm(pacote?: Pacote) {
    const modal = await this.modalCtrl.create({
      component: PacoteFormComponent,
      componentProps: { pacote },
      breakpoints: [0, 1], initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(pacote: Pacote) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir pacote',
      message: `Deseja excluir "${pacote.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(pacote) },
      ],
    });
    await alert.present();
  }

  async delete(pacote: Pacote) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.pacoteService.delete(pacote.id!);
      await this.showToast('Pacote excluído!', 'success');
      await this.loadData();
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { await loading.dismiss(); }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
