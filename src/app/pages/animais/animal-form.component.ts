import { errorMsg } from '../../core/utils/error.utils';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { AnimalService } from '../../core/services/animal.service';
import { ClienteService } from '../../core/services/cliente.service';
import { RacaService } from '../../core/services/raca.service';
import { Animal } from '../../core/models/animal.model';
import { Cliente } from '../../core/models/cliente.model';
import { Raca } from '../../core/models/raca.model';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';

@Component({ selector: 'app-animal-form', templateUrl: './animal-form.component.html' })
export class AnimalFormComponent implements OnInit {
  @Input() animal?: Animal;
  @Input() presetClienteId?: number; // pré-selecionar tutor (vindo do perfil do cliente)

  form!: FormGroup;
  isEdit = false;
  clientes: Cliente[] = [];
  racas: Raca[] = [];

  // Labels exibidos nos campos de seleção personalizados
  clienteSelecionadoLabel = '';
  racaSelecionadaLabel = '';

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private animalService: AnimalService,
    private clienteService: ClienteService,
    private racaService: RacaService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.animal?.id;
    const idClienteInicial = this.animal?.id_cliente || this.presetClienteId || null;

    this.form = this.fb.group({
      nome:             [this.animal?.nome || '', Validators.required],
      data_nascimento:  [this.animal?.data_nascimento || null], // opcional
      id_cliente:       [idClienteInicial, Validators.required],
      id_raca:          [this.animal?.id_raca || null],
      ativo:            [this.animal?.ativo ?? true],
    });

    const [clientes, racas] = await Promise.all([
      this.clienteService.getAllAtivos(),
      this.racaService.getAll(),
    ]);
    this.clientes = clientes;
    this.racas = racas;

    // Preenche labels iniciais se já há valor selecionado
    if (idClienteInicial) {
      const c = clientes.find(x => x.id === idClienteInicial);
      if (c) this.clienteSelecionadoLabel = c.nome;
    }
    if (this.animal?.id_raca) {
      const r = racas.find(x => x.id === this.animal!.id_raca);
      if (r) this.racaSelecionadaLabel = r.nome;
    }
  }

  // Abre modal de seleção de tutor com busca
  async abrirSelecionarTutor() {
    const modal = await this.modalCtrl.create({
      component: SearchableSelectComponent,
      componentProps: {
        title: 'Selecionar Tutor',
        items: this.clientes.map(c => ({ id: c.id, label: c.nome })),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.form.patchValue({ id_cliente: data.id });
      this.clienteSelecionadoLabel = data.label;
      this.cdr.detectChanges();
    }
  }

  // Abre modal de seleção de raça com busca
  async abrirSelecionarRaca() {
    const modal = await this.modalCtrl.create({
      component: SearchableSelectComponent,
      componentProps: {
        title: 'Selecionar Raça',
        items: this.racas.map(r => ({ id: r.id, label: r.nome })),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.form.patchValue({ id_raca: data.id });
      this.racaSelecionadaLabel = data.label;
      this.cdr.detectChanges();
    }
  }

  // Limpa seleção do tutor
  limparTutor(event: Event) {
    event.stopPropagation();
    this.form.patchValue({ id_cliente: null });
    this.clienteSelecionadoLabel = '';
  }

  // Limpa seleção da raça
  limparRaca(event: Event) {
    event.stopPropagation();
    this.form.patchValue({ id_raca: null });
    this.racaSelecionadaLabel = '';
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      if (this.isEdit) {
        await this.animalService.update(this.animal!.id!, this.form.value);
      } else {
        await this.animalService.create(this.form.value);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({
        message: `Animal ${this.isEdit ? 'atualizado' : 'criado'}!`,
        duration: 2000, color: 'success', position: 'top',
      });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: errorMsg(e), duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  dismiss() { this.modalCtrl.dismiss(null); }
}
