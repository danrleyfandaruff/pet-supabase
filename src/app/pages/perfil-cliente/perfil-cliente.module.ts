import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PerfilClienteRoutingModule } from './perfil-cliente-routing.module';
import { PerfilClientePage } from './perfil-cliente.page';
import { AnimalFormModule } from '../../shared/animal-form.module';

@NgModule({
  imports: [CommonModule, IonicModule, PerfilClienteRoutingModule, AnimalFormModule],
  declarations: [PerfilClientePage],
  // AnimalFormComponent vem do AnimalFormModule
})
export class PerfilClientePageModule {}
