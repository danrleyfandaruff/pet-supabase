import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { AnimalService } from '../../core/services/animal.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ResponsavelService } from '../../core/services/responsavel.service';
import { StatusService } from '../../core/services/status.service';
import { ServicoService } from '../../core/services/servico.service';
import { PacoteService } from '../../core/services/pacote.service';
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

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private atendimentoService: AtendimentoService,
    private animalService: AnimalService,
    private clienteService: ClienteService,
    private responsavelService: ResponsavelService,
    private statusService: StatusService,
    private servicoService: ServicoService,
    private pacoteService: PacoteService,
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

  get valorTotal(): number {
    return this.valorServico + (this.form.get('valor_adicional')?.value || 0);
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
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

  dismiss() { this.modalCtrl.dismiss(null); }
}
