import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComissoesPage } from './comissoes.page';

const routes: Routes = [{ path: '', component: ComissoesPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComissoesRoutingModule {}
