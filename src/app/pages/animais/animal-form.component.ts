import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { AnimalService } from '../../core/services/animal.service';
import { ClienteService } from '../../core/services/cliente.service';
import { RacaService } from '../../core/services/raca.service';
import { Animal } from '../../core/models/animal.model';
import { Cliente } from '../../core/models/cliente.model';
import { Raca } from '../../core/models/raca.model';

@Component({ selector: 'app-animal-form', templateUrl: './animal-form.component.html' })
export class AnimalFormComponent implements OnInit {
  @Input() animal?: Animal;
  form!: FormGroup;
  isEdit = false;
  clientes: Cliente[] = [];
  racas: Raca[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private animalService: AnimalService,
    private clienteService: ClienteService,
    private racaService: RacaService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.animal?.id;
    this.form = this.fb.group({
      nome: [this.animal?.nome || '', Validators.required],
      data_nascimento: [this.animal?.data_nascimento || ''],
      id_cliente: [this.animal?.id_cliente || null],
      id_raca: [this.animal?.id_raca || null],
      ativo: [this.animal?.ativo ?? true],
    });
    const [clientes, racas] = await Promise.all([
      this.clienteService.getAllAtivos(),
      this.racaService.getAll(),
    ]);
    this.clientes = clientes;
    this.racas = racas;
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
      const t = await this.toastCtrl.create({ message: `Animal ${this.isEdit ? 'atualizado' : 'criado'}!`, duration: 2000, color: 'success', position: 'top' });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  dismiss() { this.modalCtrl.dismiss(null); }
}
