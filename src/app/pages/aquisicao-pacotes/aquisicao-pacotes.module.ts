import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AquisicaoPacotesRoutingModule } from './aquisicao-pacotes-routing.module';
import { AquisicaoPacotesPage } from './aquisicao-pacotes.page';
import { AquisicaoPacoteFormComponent } from './aquisicao-pacote-form.component';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, AquisicaoPacotesRoutingModule],
  declarations: [AquisicaoPacotesPage, AquisicaoPacoteFormComponent],
})
export class AquisicaoPacotesPageModule {}
