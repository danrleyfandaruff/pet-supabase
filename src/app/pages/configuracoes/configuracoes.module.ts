import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConfiguracoesPage } from './configuracoes.page';
import { ConfiguracoesPageRoutingModule } from './configuracoes-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ConfiguracoesPageRoutingModule],
  declarations: [ConfiguracoesPage],
})
export class ConfiguracoesPageModule {}
