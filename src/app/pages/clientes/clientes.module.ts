import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ClientesPage } from './clientes.page';
import { ClienteFormComponent } from './cliente-form.component';
import { ClientesPageRoutingModule } from './clientes-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ClientesPageRoutingModule],
  declarations: [ClientesPage, ClienteFormComponent],
})
export class ClientesPageModule {}
