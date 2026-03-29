import { errorMsg } from '../../core/utils/error.utils';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { ServicoService } from '../../core/services/servico.service';
import { TipoServicoService } from '../../core/services/tipo-servico.service';
import { Servico } from '../../core/models/servico.model';
import { TipoServico } from '../../core/models/tipo-servico.model';

@Component({ selector: 'app-servico-form', templateUrl: './servico-form.component.html' })
export class ServicoFormComponent implements OnInit {
  @Input() servico?: Servico;
  form!: FormGroup;
  isEdit = false;
  tipos: TipoServico[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private servicoService: ServicoService,
    private tipoServicoService: TipoServicoService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.isEdit = !!this.servico?.id;
    this.form = this.fb.group({
      nome: [this.servico?.nome || '', Validators.required],
      valor: [this.servico?.valor || null],
      id_tipo_servico: [this.servico?.id_tipo_servico || null],
      ativo: [this.servico?.ativo ?? true],
    });
    this.tipos = await this.tipoServicoService.getAll();
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const loading = await this.loadingCtrl.create({ message: 'Salvando...', spinner: 'crescent' });
    await loading.present();
    try {
      if (this.isEdit) {
        await this.servicoService.update(this.servico!.id!, this.form.value);
      } else {
        await this.servicoService.create(this.form.value);
      }
      await this.modalCtrl.dismiss(true);
      const t = await this.toastCtrl.create({ message: `Serviço ${this.isEdit ? 'atualizado' : 'criado'}!`, duration: 2000, color: 'success', position: 'top' });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: errorMsg(e), duration: 3000, color: 'danger', position: 'top' });
      await t.present();
    } finally { await loading.dismiss(); }
  }

  dismiss() { this.modalCtrl.dismiss(null); }
}
