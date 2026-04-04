import { errorMsg } from '../../core/utils/error.utils';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { PerfilUsuario } from '../../core/models/user.model';
import { Router } from '@angular/router';
import { RacaService } from '../../core/services/raca.service';
import { ResponsavelService } from '../../core/services/responsavel.service';
import { StatusService } from '../../core/services/status.service';
import { TipoServicoService } from '../../core/services/tipo-servico.service';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { Raca } from '../../core/models/raca.model';
import { Responsavel } from '../../core/models/responsavel.model';
import { Status } from '../../core/models/status.model';
import { TipoServico } from '../../core/models/tipo-servico.model';
import { Colaborador, ColaboradorBloqueio, ColaboradorDisponibilidade } from '../../core/models/colaborador.model';
import { AuthService } from '../../core/services/auth.service';
import { PermissaoService } from '../../core/services/permissao.service';

interface ColaboradorConfigDraft {
  avatar_url: string;
  percentual_comissao_padrao: number;
  percentual_comissao_banho: number | null;
  percentual_comissao_tosa: number | null;
  percentual_comissao_adicional: number;
  disponibilidade_semanal: ColaboradorDisponibilidade[];
}

@Component({ selector: 'app-configuracoes', templateUrl: './configuracoes.page.html', styleUrls: ['./configuracoes.page.scss'] })
export class ConfiguracoesPage implements OnInit {
  racas: Raca[] = [];
  responsaveis: Responsavel[] = [];
  statusList: Status[] = [];
  tiposServico: TipoServico[] = [];
  colaboradores: Colaborador[] = [];
  colaboradorExpandedId: string | null = null;
  colaboradorDrafts: Record<string, ColaboradorConfigDraft> = {};
  readonly diasSemana = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sab' },
  ];
  isLoading = false;

  constructor(
    private racaService: RacaService,
    private responsavelService: ResponsavelService,
    private statusService: StatusService,
    private tipoServicoService: TipoServicoService,
    private colaboradorService: ColaboradorService,
    private authService: AuthService,
    public permissao: PermissaoService,
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
      const [racas, responsaveis, statusList, tiposServico, colaboradores] = await Promise.all([
        this.racaService.getAll(),
        this.responsavelService.getAll(),
        this.statusService.getAll(),
        this.tipoServicoService.getAll(),
        this.colaboradorService.getAll(),
      ]);
      this.racas = racas;
      this.responsaveis = responsaveis;
      this.statusList = statusList;
      this.tiposServico = tiposServico;
      this.colaboradores = colaboradores;
      this.initColaboradorDrafts();
    } catch (e: any) { await this.showToast(errorMsg(e), 'danger'); }
    finally { this.isLoading = false; }
  }

  private initColaboradorDrafts() {
    this.colaboradorDrafts = Object.fromEntries(
      this.colaboradores.map((c) => [c.id, this.createDraft(c)]),
    );
  }

  private createDraft(c: Colaborador): ColaboradorConfigDraft {
    const disponibilidade = this.diasSemana.map((dia) => {
      const atual = (c.disponibilidade_semanal ?? []).find((item) => item.dia_semana === dia.value);
      return {
        dia_semana: dia.value,
        ativo: atual?.ativo !== false,
        hora_inicio: atual?.hora_inicio ?? '08:00',
        hora_fim: atual?.hora_fim ?? '18:00',
        intervalo_inicio: atual?.intervalo_inicio ?? '12:00',
        intervalo_fim: atual?.intervalo_fim ?? '13:00',
      };
    });

    return {
      avatar_url: c.avatar_url ?? '',
      percentual_comissao_padrao: Number(c.percentual_comissao_padrao ?? 30),
      percentual_comissao_banho: c.percentual_comissao_banho ?? null,
      percentual_comissao_tosa: c.percentual_comissao_tosa ?? null,
      percentual_comissao_adicional: Number(c.percentual_comissao_adicional ?? 30),
      disponibilidade_semanal: disponibilidade,
    };
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

  // ── COLABORADORES ────────────────────────

  /** Alert com radio buttons para seleção de perfil — funciona como um select nativo */
  private selecionarPerfilAlert(atual: PerfilUsuario = 'atendente'): Promise<PerfilUsuario | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Nível de acesso',
        inputs: [
          {
            type: 'radio',
            label: 'Administrador — acesso total',
            value: 'admin',
            checked: atual === 'admin',
          },
          {
            type: 'radio',
            label: 'Atendente — sem caixa e relatórios',
            value: 'atendente',
            checked: atual === 'atendente',
          },
          {
            type: 'radio',
            label: 'Tosador / Banista — somente agenda',
            value: 'tosador',
            checked: atual === 'tosador',
          },
        ],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          { text: 'Confirmar', handler: (v) => resolve(v as PerfilUsuario) },
        ],
      });
      await alert.present();
    });
  }

  async addColaborador() {
    const alert = await this.alertCtrl.create({
      header: 'Novo Colaborador',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'E-mail' },
        { name: 'password', type: 'password', placeholder: 'Senha temporária' },
        { name: 'nome', placeholder: 'Nome (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Selecionar perfil →',
          handler: async (d) => {
            if (!d.email || !d.password) {
              await this.showToast('E-mail e senha são obrigatórios', 'warning');
              return false;
            }

            const perfil = await this.selecionarPerfilAlert('atendente');
            if (!perfil) return true; // cancelou seleção de perfil

            try {
              await this.colaboradorService.convidar({
                email: d.email,
                password: d.password,
                nome: d.nome || undefined,
                perfil,
              });
              await this.showToast('Colaborador adicionado!', 'success');
              await this.loadAll();
            } catch (e: unknown) {
              await this.showToast(errorMsg(e), 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async editColaborador(c: Colaborador) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Colaborador',
      inputs: [
        { name: 'nome', value: c.nome || '', placeholder: 'Nome' },
        { name: 'cargo', value: c.cargo || '', placeholder: 'Cargo (ex: Tosadora)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Selecionar perfil →',
          handler: async (d) => {
            const perfil = await this.selecionarPerfilAlert(c.perfil ?? 'atendente');
            if (!perfil) return true; // cancelou seleção de perfil

            try {
              await this.colaboradorService.update(c.id, {
                nome: d.nome,
                cargo: d.cargo,
                perfil,
              });
              await this.loadAll();
            } catch (e: unknown) {
              await this.showToast(errorMsg(e), 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  toggleColaboradorConfig(c: Colaborador) {
    this.colaboradorExpandedId = this.colaboradorExpandedId === c.id ? null : c.id;
    if (!this.colaboradorDrafts[c.id]) {
      this.colaboradorDrafts[c.id] = this.createDraft(c);
    }
  }

  getColaboradorDraft(c: Colaborador): ColaboradorConfigDraft {
    if (!this.colaboradorDrafts[c.id]) {
      this.colaboradorDrafts[c.id] = this.createDraft(c);
    }
    return this.colaboradorDrafts[c.id];
  }

  resetColaboradorConfig(c: Colaborador) {
    this.colaboradorDrafts[c.id] = this.createDraft(c);
  }

  async saveColaboradorConfig(c: Colaborador) {
    const draft = this.getColaboradorDraft(c);
    try {
      await this.colaboradorService.updateConfiguracoes(c.id, {
        avatar_url: draft.avatar_url?.trim() || null,
        percentual_comissao_padrao: Number(draft.percentual_comissao_padrao || 0),
        percentual_comissao_banho: draft.percentual_comissao_banho === null ? null : Number(draft.percentual_comissao_banho),
        percentual_comissao_tosa: draft.percentual_comissao_tosa === null ? null : Number(draft.percentual_comissao_tosa),
        percentual_comissao_adicional: Number(draft.percentual_comissao_adicional || 0),
        disponibilidade_semanal: draft.disponibilidade_semanal.map((item) => ({
          ...item,
          hora_inicio: item.ativo ? item.hora_inicio ?? null : null,
          hora_fim: item.ativo ? item.hora_fim ?? null : null,
          intervalo_inicio: item.ativo ? item.intervalo_inicio ?? null : null,
          intervalo_fim: item.ativo ? item.intervalo_fim ?? null : null,
        })),
      });
      await this.showToast('Configurações salvas com sucesso', 'success');
      await this.loadAll();
      this.colaboradorExpandedId = c.id;
    } catch (e: unknown) {
      await this.showToast(errorMsg(e), 'danger');
    }
  }

  async addBloqueioColaborador(c: Colaborador) {
    const alert = await this.alertCtrl.create({
      header: `Novo bloqueio — ${c.nome || c.email}`,
      inputs: [
        { name: 'data', type: 'date', placeholder: 'Data' },
        { name: 'hora_inicio', type: 'time', placeholder: 'Início' },
        { name: 'hora_fim', type: 'time', placeholder: 'Fim' },
        { name: 'descricao', placeholder: 'Descrição (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Dia todo',
          handler: async (d) => {
            if (!d.data) {
              await this.showToast('Informe a data do bloqueio', 'warning');
              return false;
            }
            try {
              await this.colaboradorService.adicionarBloqueio(c.id, {
                data: d.data,
                dia_todo: true,
                descricao: d.descricao || null,
              });
              await this.showToast('Bloqueio criado', 'success');
              await this.loadAll();
            } catch (e: unknown) {
              await this.showToast(errorMsg(e), 'danger');
            }
            return true;
          },
        },
        {
          text: 'Salvar',
          handler: async (d) => {
            if (!d.data || !d.hora_inicio || !d.hora_fim) {
              await this.showToast('Informe data, início e fim do bloqueio', 'warning');
              return false;
            }
            try {
              await this.colaboradorService.adicionarBloqueio(c.id, {
                data: d.data,
                hora_inicio: d.hora_inicio,
                hora_fim: d.hora_fim,
                descricao: d.descricao || null,
              });
              await this.showToast('Bloqueio criado', 'success');
              await this.loadAll();
            } catch (e: unknown) {
              await this.showToast(errorMsg(e), 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async removeBloqueioColaborador(c: Colaborador, bloqueio: ColaboradorBloqueio) {
    const alert = await this.alertCtrl.create({
      header: 'Remover bloqueio',
      message: `Deseja remover o bloqueio de ${this.formatarDataCurta(bloqueio.data)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            try {
              await this.colaboradorService.removerBloqueio(Number(bloqueio.id));
              await this.showToast('Bloqueio removido', 'success');
              await this.loadAll();
              this.colaboradorExpandedId = c.id;
            } catch (e: unknown) {
              await this.showToast(errorMsg(e), 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async onColaboradorFotoSelecionada(event: Event, c: Colaborador) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      this.getColaboradorDraft(c).avatar_url = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  formatarDataCurta(data?: string): string {
    if (!data) return '';
    return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
  }

  async toggleAtivoColaborador(c: Colaborador) {
    const novoStatus = !c.ativo;
    const label = novoStatus ? 'Reativar' : 'Desativar';
    const alert = await this.alertCtrl.create({
      header: `${label} Colaborador`,
      message: `${label} "${c.nome || c.email}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: label,
          handler: async () => {
            await this.colaboradorService.update(c.id, { ativo: novoStatus });
            await this.loadAll();
          },
        },
      ],
    });
    await alert.present();
  }

  async removeColaborador(c: Colaborador) {
    const alert = await this.alertCtrl.create({
      header: 'Remover Colaborador',
      message: `Remover "${c.nome || c.email}" da empresa? O acesso será desativado.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            await this.colaboradorService.remove(c.id);
            await this.loadAll();
          },
        },
      ],
    });
    await alert.present();
  }

  perfilLabel(perfil?: string): string {
    switch (perfil) {
      case 'admin':    return 'Administrador';
      case 'atendente': return 'Atendente';
      case 'tosador':  return 'Tosador / Banista';
      default:         return 'Sem perfil';
    }
  }

  perfilColor(perfil?: string): string {
    switch (perfil) {
      case 'admin':    return 'primary';
      case 'atendente': return 'secondary';
      case 'tosador':  return 'tertiary';
      default:         return 'medium';
    }
  }

  verManual() {
    localStorage.removeItem('groomerlab360_manual_visto');
    this.router.navigate(['/manual']);
  }

  async confirmarLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Sair da conta',
      message: 'Deseja encerrar sua sessão?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => {
            this.authService.logout().subscribe(() => {
              this.router.navigate(['/login'], { replaceUrl: true });
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
