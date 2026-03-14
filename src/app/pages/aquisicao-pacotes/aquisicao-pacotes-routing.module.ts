import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AquisicaoPacotesPage } from './aquisicao-pacotes.page';

const routes: Routes = [{ path: '', component: AquisicaoPacotesPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AquisicaoPacotesRoutingModule {}
