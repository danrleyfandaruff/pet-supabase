import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InicioPage } from './inicio.page';
import { InicioPageRoutingModule } from './inicio-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, InicioPageRoutingModule],
  declarations: [InicioPage],
})
export class InicioPageModule {}
