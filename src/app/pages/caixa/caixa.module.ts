import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CaixaPage } from './caixa.page';
import { CaixaPageRoutingModule } from './caixa-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, CaixaPageRoutingModule],
  declarations: [CaixaPage],
})
export class CaixaPageModule {}
