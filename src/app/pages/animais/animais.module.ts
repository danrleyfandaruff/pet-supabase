import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AnimaisPage } from './animais.page';
import { AnimaisPageRoutingModule } from './animais-routing.module';
import { AnimalFormModule } from '../../shared/animal-form.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, AnimaisPageRoutingModule, AnimalFormModule],
  declarations: [AnimaisPage],
  // AnimalFormComponent vem do AnimalFormModule
})
export class AnimaisPageModule {}
