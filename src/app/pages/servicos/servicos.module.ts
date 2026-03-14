import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ServicosPage } from './servicos.page';
import { ServicoFormComponent } from './servico-form.component';
import { ServicosPageRoutingModule } from './servicos-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ServicosPageRoutingModule],
  declarations: [ServicosPage, ServicoFormComponent],
})
export class ServicosPageModule {}
