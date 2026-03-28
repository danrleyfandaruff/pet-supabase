import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { AnimalService } from '../../core/services/animal.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ResponsavelService } from '../../core/services/responsavel.service';
import { StatusService } from '../../core/services/status.service';
import { ServicoService } from '../../core/services/servico.service';
import { PacoteService } from '../../core/services/pacote.service';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { Animal } from '../../core/models/animal.model';
import { Cliente } from '../../core/models/cliente.model';
import { Responsavel } from '../../core/models/responsavel.model';
import { Status } from '../../core/models/status.model';
import { Servico } from '../../core/models/servico.model';
import { Pacote } from '../../core/models/pacote.model';

@Component({
  selector: 'app-atendimento-form',
  templateUrl: './atendimento-form.component.html',
  styleUrls: ['./atendimento-form.component.scss'],
})
export class AtendimentoFormComponent implements OnInit {
  @Input() atendimento?: Atendimento;
  form!: FormGroup;
  isEdit = false;

  clientes: Cliente[] = [];
  todosAnimais: Animal[] = [];
  animaisFiltrados: Animal[] = [];
  responsaveis: Responsavel[] = [];
  statusList: Status[] = [];
  servicos: Servico[] = [];
  pacotes: Pacote[] = [];

  // ── Fluxo de pacote multi-sessão ────────────────────
  step: 'form' | 'preview' = 'form';
  datasGeradas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private atendimentoService: AtendimentoService,
    private animalService: AnimalService,
    private clienteService: ClienteService,
    private responsavelService: ResponsavelService,
    private statusService: StatusService,
    private servicoService: ServicoService,
    private pacoteService: PacoteService,
    private aquisicaoPacoteService: AquisicaoPacoteService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.atendimento?.id;

    this.form = this.fb.group({
      id_cliente:      [this.atendimento?.id_cliente || null],
      id_animal:       [this.atendimento?.id_animal || null],
      data:            [this.atendimento?.data || new Date().toISOString().split('T')[0], Validators.required],
      id_responsavel:  [this.atendimento?.id_responsavel || null],
      status:          [this.atendimento?.status || null],
      id_servico:      [this.atendimento?.id_servico || null],
      id_pacote:       [this.atendimento?.id_pacote || null],
      valor_adicional: [this.atendimento?.valor_adicional || null],
    });

    const [clientes, animais, responsaveis, statusList, servicos, pacotes] = await Promise.all([
      this.clienteService.getAll(),
      this.animalService.getAll(),
      this.responsavelService.getAll(),
      this.statusService.getAll(),
      this.servicoService.getAll(),
      this.pacoteService.getAll(),
    ]);

    this.clientes = clientes;
    this.todosAnimais = animais;
    this.animaisFiltrados = animais;
    this.responsaveis = responsaveis;
    this.statusList = statusList;
    this.servicos = servicos.filter(s => s.ativo !== false);
    this.pacotes = pacotes.filter(p => p.ativo !== false);

    // Default status "Agendado" ao criar novo atendimento
    if (!this.isEdit) {
      const agendado = statusList.find(s => s.nome?.toLowerCase().includes('agendad'));
      if (agendado?.id) {
        this.form.patchValue({ status: agendado.id });
      }
    }

    // Se editando e tem tutor, filtra animais
    if (this.atendimento?.id_cliente) {
      this.filtrarAnimaisPorTutor(this.atendimento.id_cliente);
    }

    // Observa mudança de tutor
    this.form.get('id_cliente')!.valueChanges.subscribe(idCliente => {
      this.onTutorChange(idCliente);
    });
  }

  onTutorChange(idCliente: number | null) {
    this.form.patchValue({ id_animal: null });
    if (idCliente) {
      this.filtrarAnimaisPorTutor(idCliente);
    } else {
      this.animaisFiltrados = [...this.todosAnimais];
    }
  }

  private filtrarAnimaisPorTutor(idCliente: number) {
    this.animaisFiltrados = this.todosAnimais.filter(a => a.id_cliente === idCliente);
  }

  get valorServico(): number {
    const id = this.form.get('id_servico')?.value;
    if (!id) return 0;
    return this.servicos.find(s => s.id === id)?.valor || 0;
  }

  get nomeServico(): string {
    const id = this.form.get('id_servico')?.value;
    if (!id) return '';
    return this.servicos.find(s => s.id === id)?.nome || '';
  }

  get valorTotal(): number {
    return this.valorServico + (this.form.get('valor_adicional')?.value || 0);
  }

  /** Valor total do pacote inteiro (valor por sessão × quantidade de sessões). */
  get valorTotalPacote(): number {
    const qtd = this.pacoteSelecionado?.quantidade ?? 1;
    return this.valorTotal * qtd;
  }

  // ── Pacote selecionado ───────────────────────────────
  get pacoteSelecionado(): Pacote | null {
    const id = this.form.get('id_pacote')?.value;
    return this.pacotes.find(p => p.id === id) ?? null;
  }

  get isPacoteMultisessao(): boolean {
    const p = this.pacoteSelecionado;
    return !this.isEdit && !!p && (p.quantidade ?? 0) > 1;
  }

  // ── Save / Preview ───────────────────────────────────
  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.isPacoteMultisessao) {
      this.abrirPreview();
      return;
    }

    await this.salvarAtendimentoSimples();
  }

  private async salvarAtendimentoSimples() {
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      const payload = {
        ...this.form.value,
        id_cliente:      this.form.value.id_cliente      || null,
        id_animal:       this.form.value.id_animal       || null,
        id_responsavel:  this.form.value.id_responsavel  || null,
        id_servico:      this.form.value.id_servico      || null,
        id_pacote:       this.form.value.id_pacote       || null,
        status:          this.form.value.status          || null,
        valor_adicional: this.form.value.valor_adicional || null,
      };
      if (this.isEdit) {
        await this.atendimentoService.update(this.atendimento!.id!, payload);
      } else {
        await this.atendimentoService.create(payload);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({
        message: `Atendimento ${this.isEdit ? 'atualizado' : 'agendado'}!`,
        duration: 2000, color: 'success', position: 'top',
      });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  // ── Fluxo multi-sessão ───────────────────────────────
  private abrirPreview() {
    const pacote = this.pacoteSelecionado!;
    const dataBase = this.form.get('data')!.value as string;
    const quantidade = pacote.quantidade ?? 1;
    const recorrencia = pacote.recorrencia ?? 7;

    this.datasGeradas = Array.from({ length: quantidade }, (_, i) => {
      const d = new Date(dataBase + 'T12:00:00');
      d.setDate(d.getDate() + i * recorrencia);
      return d.toISOString().split('T')[0];
    });

    this.step = 'preview';
  }

  voltarForm() {
    this.step = 'form';
  }

  onDataChange(index: number, value: string) {
    if (!value) return;
    this.datasGeradas = this.datasGeradas.map((d, i) => i === index ? value : d);
  }

  async confirmarPacote() {
    const loading = await this.loadingCtrl.create({ message: 'Agendando sessões...', spinner: 'crescent' });
    await loading.present();
    try {
      const fv = this.form.value;

      // 1. Cria o vínculo aquisição de pacote
      const aq = await this.aquisicaoPacoteService.create({
        id_pacote:      fv.id_pacote,
        id_animal:      fv.id_animal || null,
        data_aquisicao: this.datasGeradas[0],
      });

      // 2. Cria um atendimento para cada data
      const base = {
        id_cliente:          fv.id_cliente      || null,
        id_animal:           fv.id_animal       || null,
        id_responsavel:      fv.id_responsavel  || null,
        status:              fv.status          || null,
        id_servico:          fv.id_servico      || null,
        id_pacote:           fv.id_pacote,
        id_aquisicao_pacote: aq.id,
        valor_adicional:     fv.valor_adicional || null,
      };

      await Promise.all(
        this.datasGeradas.map(data => this.atendimentoService.create({ ...base, data }))
      );

      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({
        message: `${this.datasGeradas.length} sessões agendadas! 🎉`,
        duration: 2500, color: 'success', position: 'top',
      });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  // ── Cadastro rápido de tutor ─────────────────────────
  async adicionarCliente() {
    const alert = await this.alertCtrl.create({
      header: 'Novo Tutor',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome completo' },
        { name: 'telefone', type: 'tel', placeholder: 'Telefone (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            if (!data.nome?.trim()) return false;
            this.criarClienteRapido(data.nome.trim(), data.telefone?.trim() || null);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async criarClienteRapido(nome: string, telefone: string | null) {
    try {
      const novo = await this.clienteService.create({ nome, telefone: telefone || undefined });
      this.clientes = [...this.clientes, novo];
      this.form.patchValue({ id_cliente: novo.id });
      this.onTutorChange(novo.id!);
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    }
  }

  // ── Cadastro rápido de pet ───────────────────────────
  async adicionarPet() {
    const idCliente = this.form.get('id_cliente')?.value as number | null;
    const tutorNome = idCliente
      ? (this.clientes.find(c => c.id === idCliente)?.nome || '')
      : '';

    const alert = await this.alertCtrl.create({
      header: 'Novo Pet',
      subHeader: tutorNome ? `Tutor: ${tutorNome}` : undefined,
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome do pet' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            if (!data.nome?.trim()) return false;
            this.criarPetRapido(data.nome.trim(), idCliente);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async criarPetRapido(nome: string, idCliente: number | null) {
    try {
      const novo = await this.animalService.create({
        nome,
        id_cliente: idCliente || undefined,
      });
      this.todosAnimais = [...this.todosAnimais, novo];
      if (idCliente) {
        this.animaisFiltrados = [...this.animaisFiltrados, novo];
      } else {
        this.animaisFiltrados = [...this.todosAnimais];
      }
      this.form.patchValue({ id_animal: novo.id });
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    }
  }

  // ── Helpers ──────────────────────────────────────────
  formatDateLabel(dateStr: string): { dia: string; mes: string; semana: string } {
    const d = new Date(dateStr + 'T12:00:00');
    const dias  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return {
      dia:    String(d.getDate()).padStart(2, '0'),
      mes:    meses[d.getMonth()],
      semana: dias[d.getDay()],
    };
  }

  trackByIndex(index: number): number { return index; }

  dismiss() { this.modalCtrl.dismiss(null); }
}
