import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PlanosPage } from './planos.page';
import { PlanosPageRoutingModule } from './planos-routing.module';
import { PlanoDetalheComponent } from './plano-detalhe.component';

@NgModule({
  imports: [CommonModule, IonicModule, PlanosPageRoutingModule],
  declarations: [PlanosPage, PlanoDetalheComponent],
})
export class PlanosPageModule {}
