import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PacotesPage } from './pacotes.page';
import { PacoteFormComponent } from './pacote-form.component';
import { PacotesPageRoutingModule } from './pacotes-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, PacotesPageRoutingModule],
  declarations: [PacotesPage, PacoteFormComponent],
})
export class PacotesPageModule {}
