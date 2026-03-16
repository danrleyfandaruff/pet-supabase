import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilClientePage } from './perfil-cliente.page';

const routes: Routes = [{ path: ':id', component: PerfilClientePage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilClienteRoutingModule {}
