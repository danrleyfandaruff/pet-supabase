import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AtendimentosPage } from './atendimentos.page';
import { AtendimentoFormComponent } from './atendimento-form.component';
import { AtendimentosPageRoutingModule } from './atendimentos-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, AtendimentosPageRoutingModule],
  declarations: [AtendimentosPage, AtendimentoFormComponent],
})
export class AtendimentosPageModule {}
