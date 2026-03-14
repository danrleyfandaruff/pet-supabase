import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { PacoteService } from '../../core/services/pacote.service';
import { AnimalService } from '../../core/services/animal.service';
import { AquisicaoPacote } from '../../core/models/aquisicao-pacote.model';
import { Pacote } from '../../core/models/pacote.model';
import { Animal } from '../../core/models/animal.model';

@Component({
  selector: 'app-aquisicao-pacote-form',
  templateUrl: './aquisicao-pacote-form.component.html',
})
export class AquisicaoPacoteFormComponent implements OnInit {
  @Input() aquisicao?: AquisicaoPacote;
  form!: FormGroup;
  isEdit = false;
  pacotes: Pacote[] = [];
  animais: Animal[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private aquisicaoService: AquisicaoPacoteService,
    private pacoteService: PacoteService,
    private animalService: AnimalService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.aquisicao?.id;
    this.form = this.fb.group({
      id_pacote:       [this.aquisicao?.id_pacote || null, Validators.required],
      id_animal:       [this.aquisicao?.id_animal || null],
      data_aquisicao:  [this.aquisicao?.data_aquisicao || new Date().toISOString().split('T')[0], Validators.required],
      data_pagamento:  [this.aquisicao?.data_pagamento || ''],
    });
    const [pacotes, animais] = await Promise.all([
      this.pacoteService.getAll(),
      this.animalService.getAll(),
    ]);
    this.pacotes = pacotes;
    this.animais = animais;
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      const payload = {
        ...this.form.value,
        data_pagamento: this.form.value.data_pagamento || null,
      };
      if (this.isEdit) {
        await this.aquisicaoService.update(this.aquisicao!.id!, payload);
      } else {
        await this.aquisicaoService.create(payload);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({
        message: `Aquisição ${this.isEdit ? 'atualizada' : 'registrada'}!`,
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
