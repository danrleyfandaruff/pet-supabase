import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProntuarioPage } from './prontuario.page';

const routes: Routes = [{ path: ':id', component: ProntuarioPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProntuarioRoutingModule {}
