import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PerfilClienteRoutingModule } from './perfil-cliente-routing.module';
import { PerfilClientePage } from './perfil-cliente.page';

@NgModule({
  imports: [CommonModule, IonicModule, PerfilClienteRoutingModule],
  declarations: [PerfilClientePage],
})
export class PerfilClientePageModule {}
