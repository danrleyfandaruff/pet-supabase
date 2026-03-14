import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { RacaService } from '../../core/services/raca.service';
import { ResponsavelService } from '../../core/services/responsavel.service';
import { StatusService } from '../../core/services/status.service';
import { TipoServicoService } from '../../core/services/tipo-servico.service';
import { Raca } from '../../core/models/raca.model';
import { Responsavel } from '../../core/models/responsavel.model';
import { Status } from '../../core/models/status.model';
import { TipoServico } from '../../core/models/tipo-servico.model';

@Component({ selector: 'app-configuracoes', templateUrl: './configuracoes.page.html', styleUrls: ['./configuracoes.page.scss'] })
export class ConfiguracoesPage implements OnInit {
  racas: Raca[] = [];
  responsaveis: Responsavel[] = [];
  statusList: Status[] = [];
  tiposServico: TipoServico[] = [];
  isLoading = false;

  constructor(
    private racaService: RacaService,
    private responsavelService: ResponsavelService,
    private statusService: StatusService,
    private tipoServicoService: TipoServicoService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() { this.loadAll(); }
  ionViewWillEnter() { this.loadAll(); }

  async loadAll() {
    this.isLoading = true;
    try {
      const [racas, responsaveis, statusList, tiposServico] = await Promise.all([
        this.racaService.getAll(),
        this.responsavelService.getAll(),
        this.statusService.getAll(),
        this.tipoServicoService.getAll(),
      ]);
      this.racas = racas;
      this.responsaveis = responsaveis;
      this.statusList = statusList;
      this.tiposServico = tiposServico;
    } catch (e: any) { await this.showToast(e.message, 'danger'); }
    finally { this.isLoading = false; }
  }

  // ── RAÇAS ──────────────────────────────
  async addRaca() {
    const alert = await this.alertCtrl.create({
      header: 'Nova Raça', inputs: [{ name: 'nome', placeholder: 'Nome da raça' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.racaService.create({ nome: d.nome }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async editRaca(raca: Raca) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Raça', inputs: [{ name: 'nome', value: raca.nome, placeholder: 'Nome da raça' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.racaService.update(raca.id!, { nome: d.nome }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async deleteRaca(raca: Raca) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir Raça', message: `Excluir "${raca.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: async () => { await this.racaService.delete(raca.id!); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  // ── RESPONSÁVEIS ────────────────────────
  async addResponsavel() {
    const alert = await this.alertCtrl.create({
      header: 'Novo Responsável', inputs: [{ name: 'nome', placeholder: 'Nome' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.responsavelService.create({ nome: d.nome, ativo: true }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async editResponsavel(r: Responsavel) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Responsável', inputs: [{ name: 'nome', value: r.nome, placeholder: 'Nome' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.responsavelService.update(r.id!, { nome: d.nome }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async deleteResponsavel(r: Responsavel) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir Responsável', message: `Excluir "${r.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: async () => { await this.responsavelService.delete(r.id!); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  // ── STATUS ────────────────────────────
  async addStatus() {
    const alert = await this.alertCtrl.create({
      header: 'Novo Status', inputs: [
        { name: 'nome', placeholder: 'Nome' },
        { name: 'descricao', placeholder: 'Descrição (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.statusService.create({ nome: d.nome, descricao: d.descricao }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async editStatus(s: Status) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Status', inputs: [
        { name: 'nome', value: s.nome, placeholder: 'Nome' },
        { name: 'descricao', value: s.descricao || '', placeholder: 'Descrição' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.statusService.update(s.id!, { nome: d.nome, descricao: d.descricao }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async deleteStatus(s: Status) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir Status', message: `Excluir "${s.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: async () => { await this.statusService.delete(s.id!); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  // ── TIPOS DE SERVIÇO ─────────────────
  async addTipoServico() {
    const alert = await this.alertCtrl.create({
      header: 'Novo Tipo de Serviço', inputs: [{ name: 'nome', placeholder: 'Nome' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.tipoServicoService.create({ nome: d.nome }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async editTipoServico(t: TipoServico) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Tipo de Serviço', inputs: [{ name: 'nome', value: t.nome, placeholder: 'Nome' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salvar', handler: async (d) => { if (!d.nome) return; await this.tipoServicoService.update(t.id!, { nome: d.nome }); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  async deleteTipoServico(t: TipoServico) {
    const alert = await this.alertCtrl.create({
      header: 'Excluir Tipo', message: `Excluir "${t.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: async () => { await this.tipoServicoService.delete(t.id!); await this.loadAll(); } },
      ],
    });
    await alert.present();
  }

  verManual() {
    localStorage.removeItem('groomerlab360_manual_visto');
    this.router.navigate(['/manual']);
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
