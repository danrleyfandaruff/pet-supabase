import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AnimalFormComponent } from '../pages/animais/animal-form.component';
import { SharedModule } from './shared.module';

/**
 * Módulo que declara e exporta AnimalFormComponent.
 * Importar em qualquer módulo que precise usar o formulário de animal como modal.
 * (ex: AnimaisPageModule, PerfilClientePageModule)
 */
@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, SharedModule],
  declarations: [AnimalFormComponent],
  exports: [AnimalFormComponent],
})
export class AnimalFormModule {}
