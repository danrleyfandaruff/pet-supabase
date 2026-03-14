import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AnimaisPage } from './animais.page';
import { AnimalFormComponent } from './animal-form.component';
import { AnimaisPageRoutingModule } from './animais-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, AnimaisPageRoutingModule],
  declarations: [AnimaisPage, AnimalFormComponent],
})
export class AnimaisPageModule {}
