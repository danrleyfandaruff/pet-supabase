import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RelatoriosPageRoutingModule } from './relatorios-routing.module';
import { RelatoriosPage } from './relatorios.page';

@NgModule({
  imports: [CommonModule, IonicModule, RelatoriosPageRoutingModule],
  declarations: [RelatoriosPage],
})
export class RelatoriosPageModule {}
