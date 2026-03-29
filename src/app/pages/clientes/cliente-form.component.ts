import { errorMsg } from '../../core/utils/error.utils';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models/cliente.model';

@Component({ selector: 'app-cliente-form', templateUrl: './cliente-form.component.html' })
export class ClienteFormComponent implements OnInit {
  @Input() cliente?: Cliente;
  form!: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private clienteService: ClienteService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.isEdit = !!this.cliente?.id;
    this.form = this.fb.group({
      nome: [this.cliente?.nome || '', Validators.required],
      data_nascimento: [this.cliente?.data_nascimento || null],
      telefone: [this.cliente?.telefone || ''],
      email: [this.cliente?.email || '', Validators.email],
      ativo: [this.cliente?.ativo ?? true],
    });
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      if (this.isEdit) {
        await this.clienteService.update(this.cliente!.id!, this.form.value);
      } else {
        await this.clienteService.create(this.form.value);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({ message: `Cliente ${this.isEdit ? 'atualizado' : 'criado'}!`, duration: 2000, color: 'success', position: 'top' });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: errorMsg(e), duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  dismiss() { this.modalCtrl.dismiss(null); }
}
