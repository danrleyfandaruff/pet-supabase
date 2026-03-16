import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComissoesRoutingModule } from './comissoes-routing.module';
import { ComissoesPage } from './comissoes.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, ComissoesRoutingModule],
  declarations: [ComissoesPage],
})
export class ComissoesPageModule {}
