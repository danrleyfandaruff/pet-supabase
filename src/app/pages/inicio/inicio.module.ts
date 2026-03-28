import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InicioPage } from './inicio.page';
import { InicioPageRoutingModule } from './inicio-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [CommonModule, IonicModule, InicioPageRoutingModule, SharedModule],
  declarations: [InicioPage],
})
export class InicioPageModule {}
