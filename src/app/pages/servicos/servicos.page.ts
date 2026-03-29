import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { ServicoService } from '../../core/services/servico.service';
import { Servico } from '../../core/models/servico.model';
import { ServicoFormComponent } from './servico-form.component';

@Component({ selector: 'app-servicos', templateUrl: './servicos.page.html', styleUrls: ['./servicos.page.scss'] })
export class ServicosPage implements OnInit {
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  isLoading = false;

  constructor(
    private servicoService: ServicoService,
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
      this.servicos = await this.servicoService.getAll();
      this.servicosFiltrados = [...this.servicos];
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
    finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.servicosFiltrados = this.servicos.filter(s =>
      s.nome.toLowerCase().includes(q) || (s.tipo_servico as any)?.nome?.toLowerCase().includes(q)
    );
  }

  async openForm(servico?: Servico) {
    const modal = await this.modalCtrl.create({
      component: ServicoFormComponent,
      componentProps: { servico },
      breakpoints: [0, 1], initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(servico: Servico) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir serviço',
      message: `Deseja excluir "${servico.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(servico) },
      ],
    });
    await alert.present();
  }

  async delete(servico: Servico) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.servicoService.delete(servico.id!);
      await this.showToast('Serviço excluído!', 'success');
      await this.loadData();
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
    finally { await loading.dismiss(); }
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
