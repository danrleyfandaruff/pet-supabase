import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AtendimentosPage } from './atendimentos.page';
const routes: Routes = [{ path: '', component: AtendimentosPage }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AtendimentosPageRoutingModule {}
