import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models/cliente.model';
import { ClienteFormComponent } from './cliente-form.component';

@Component({ selector: 'app-clientes', templateUrl: './clientes.page.html', styleUrls: ['./clientes.page.scss'] })
export class ClientesPage implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  isLoading = false;

  constructor(
    private clienteService: ClienteService,
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
      this.clientes = await this.clienteService.getAll();
      this.clientesFiltrados = [...this.clientes];
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nome.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.telefone?.includes(q)
    );
  }

  async openForm(cliente?: Cliente) {
    const modal = await this.modalCtrl.create({
      component: ClienteFormComponent,
      componentProps: { cliente },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(cliente: Cliente) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir cliente',
      message: `Deseja excluir "${cliente.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(cliente) },
      ],
    });
    await alert.present();
  }

  async delete(cliente: Cliente) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.clienteService.delete(cliente.id!);
      await this.showToast('Cliente excluído!', 'success');
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
