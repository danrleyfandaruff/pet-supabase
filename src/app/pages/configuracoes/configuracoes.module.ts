import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConfiguracoesPage } from './configuracoes.page';
import { ConfiguracoesPageRoutingModule } from './configuracoes-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, ConfiguracoesPageRoutingModule],
  declarations: [ConfiguracoesPage],
})
export class ConfiguracoesPageModule {}
