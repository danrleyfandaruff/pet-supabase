import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { AquisicaoPacote } from '../../core/models/aquisicao-pacote.model';
import { PlanoDetalheComponent } from './plano-detalhe.component';

interface PlanoVm {
  aquisicao: AquisicaoPacote;
  petNome: string;
  pacoteNome: string;
  total: number;
  concluidos: number;
  proxData: string | null;
  cancelavel: boolean;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-planos',
  templateUrl: './planos.page.html',
  styleUrls: ['./planos.page.scss'],
})
export class PlanosPage implements OnInit {
  planos: PlanoVm[] = [];
  isLoading = false;

  constructor(
    private aquisicaoPacoteService: AquisicaoPacoteService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() { this.loadData(); }
  ionViewWillEnter() { this.loadData(); }

  async loadData() {
    this.isLoading = true;
    try {
      const lista = await this.aquisicaoPacoteService.getAll();
      this.planos = lista.map(aq => this.mapToVm(aq));
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private mapToVm(aq: AquisicaoPacote): PlanoVm {
    const ats = aq.atendimento ?? [];
    const total = aq.pacote?.quantidade ?? ats.length;
    const hoje = new Date().toISOString().split('T')[0];

    // Sessões concluídas: pagas OU status contém 'conclu'
    const concluidos = ats.filter(a =>
      a.pago || a.status_info?.nome?.toLowerCase().includes('conclu')
    ).length;

    // Próxima sessão: primeira data futura não concluída
    const pendentes = ats
      .filter(a => !a.pago && !a.status_info?.nome?.toLowerCase().includes('conclu'))
      .map(a => a.data)
      .sort();
    const proxData = pendentes[0] ?? null;

    // Cancelável: nenhuma sessão foi paga ou concluída
    const cancelavel = concluidos === 0;

    // Status do plano
    let statusLabel: string;
    let statusClass: string;
    if (concluidos === 0) {
      statusLabel = 'Agendado';
      statusClass = 'badge-primary';
    } else if (concluidos >= total) {
      statusLabel = 'Concluído';
      statusClass = 'badge-success';
    } else {
      statusLabel = `${concluidos}/${total} feitas`;
      statusClass = 'badge-warning';
    }

    return {
      aquisicao: aq,
      petNome:   aq.animal?.nome ?? '—',
      pacoteNome: aq.pacote?.nome ?? '—',
      total,
      concluidos,
      proxData,
      cancelavel,
      statusLabel,
      statusClass,
    };
  }

  async confirmarCancelamento(vm: PlanoVm) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar plano?',
      message: `Isso vai remover todas as ${vm.total} sessões agendadas de "${vm.petNome}". Esta ação não pode ser desfeita.`,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Cancelar plano',
          role: 'destructive',
          handler: () => this.executarCancelamento(vm),
        },
      ],
    });
    await alert.present();
  }

  private async executarCancelamento(vm: PlanoVm) {
    const loading = await this.loadingCtrl.create({ message: 'Cancelando...', spinner: 'crescent' });
    await loading.present();
    try {
      const ids = (vm.aquisicao.atendimento ?? []).map(a => a.id);
      await this.aquisicaoPacoteService.cancelarPlano(vm.aquisicao.id!, ids);
      await this.showToast('Plano cancelado com sucesso.', 'success');
      await this.loadData();
    } catch (e: any) {
      await this.showToast(errorMsg(e), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async abrirDetalhe(vm: PlanoVm) {
    const modal = await this.modalCtrl.create({
      component: PlanoDetalheComponent,
      componentProps: {
        aquisicaoId: vm.aquisicao.id,
        petNome:     vm.petNome,
        pacoteNome:  vm.pacoteNome,
        total:       vm.total,
        proxData:    vm.proxData,
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.alterado) {
      await this.loadData(); // recarrega a lista se houve mudança de status
    }
  }

  trackById(_: number, vm: PlanoVm) { return vm.aquisicao.id; }

  barraProgresso(vm: PlanoVm): number {
    if (!vm.total) return 0;
    return Math.round((vm.concluidos / vm.total) * 100);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  private async showToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
