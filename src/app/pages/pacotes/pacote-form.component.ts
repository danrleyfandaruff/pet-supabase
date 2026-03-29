import { errorMsg } from '../../core/utils/error.utils';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { PacoteService } from '../../core/services/pacote.service';
import { Pacote } from '../../core/models/pacote.model';

@Component({ selector: 'app-pacote-form', templateUrl: './pacote-form.component.html' })
export class PacoteFormComponent implements OnInit {
  @Input() pacote?: Pacote;
  form!: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private pacoteService: PacoteService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.isEdit = !!this.pacote?.id;
    this.form = this.fb.group({
      nome: [this.pacote?.nome || '', Validators.required],
      desconto: [this.pacote?.desconto || 0],
      quantidade: [this.pacote?.quantidade || null],
      recorrencia: [this.pacote?.recorrencia || null],
      ativo: [this.pacote?.ativo ?? true],
    });
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      if (this.isEdit) {
        await this.pacoteService.update(this.pacote!.id!, this.form.value);
      } else {
        await this.pacoteService.create(this.form.value);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({ message: `Pacote ${this.isEdit ? 'atualizado' : 'criado'}!`, duration: 2000, color: 'success', position: 'top' });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: errorMsg(e), duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  dismiss() { this.modalCtrl.dismiss(null); }
}
