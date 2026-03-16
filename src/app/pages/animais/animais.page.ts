import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AnimalService } from '../../core/services/animal.service';
import { Animal } from '../../core/models/animal.model';
import { AnimalFormComponent } from './animal-form.component';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Atendimento } from '../../core/models/atendimento.model';

@Component({ selector: 'app-animais', templateUrl: './animais.page.html', styleUrls: ['./animais.page.scss'] })
export class AnimaisPage implements OnInit {
  animais: Animal[] = [];
  animaisFiltrados: Animal[] = [];
  isLoading = false;

  // ── Histórico ─────────────────────────────────────────
  historicoAberto = false;
  animalHistorico: Animal | null = null;
  historicoAtendimentos: Atendimento[] = [];
  historicoLoading = false;

  constructor(
    private animalService: AnimalService,
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
      this.animais = await this.animalService.getAll();
      this.animaisFiltrados = [...this.animais];
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { this.isLoading = false; }
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.animaisFiltrados = this.animais.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      (a.cliente as any)?.nome?.toLowerCase().includes(q) ||
      (a.raca as any)?.nome?.toLowerCase().includes(q)
    );
  }

  async openForm(animal?: Animal) {
    const modal = await this.modalCtrl.create({
      component: AnimalFormComponent,
      componentProps: { animal },
      breakpoints: [0, 1], initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) await this.loadData();
  }

  async confirmDelete(animal: Animal) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir animal',
      message: `Deseja excluir "${animal.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => this.delete(animal) },
      ],
    });
    await alert.present();
  }

  async delete(animal: Animal) {
    const loading = await this.loadingCtrl.create({ message: 'Excluindo...', spinner: 'crescent' });
    await loading.present();
    try {
      await this.animalService.delete(animal.id!);
      await this.showToast('Animal excluído!', 'success');
      await this.loadData();
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { await loading.dismiss(); }
  }

  // ── Histórico ─────────────────────────────────────────
  async abrirHistorico(animal: Animal) {
    this.animalHistorico = animal;
    this.historicoAberto = true;
    this.historicoLoading = true;
    this.historicoAtendimentos = [];
    try {
      this.historicoAtendimentos = await this.atendimentoService.getByAnimal(animal.id!);
    } catch (e: any) {
      await this.showToast(e.message, 'danger');
    } finally {
      this.historicoLoading = false;
    }
  }

  fecharHistorico() {
    this.historicoAberto = false;
    this.animalHistorico = null;
    this.historicoAtendimentos = [];
  }

  formatDate(d: string): string {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
