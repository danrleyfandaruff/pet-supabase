import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      // Tab principal — home com acesso rápido
      {
        path: 'inicio',
        loadChildren: () =>
          import('../inicio/inicio.module').then((m) => m.InicioPageModule),
      },
      // Tab de ajustes
      {
        path: 'ajustes',
        loadChildren: () =>
          import('../configuracoes/configuracoes.module').then(
            (m) => m.ConfiguracoesPageModule
          ),
      },
      // Seções acessadas via cards do Início (sem botão no tab bar)
      {
        path: 'atendimentos',
        loadChildren: () =>
          import('../atendimentos/atendimentos.module').then((m) => m.AtendimentosPageModule),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('../clientes/clientes.module').then((m) => m.ClientesPageModule),
      },
      {
        path: 'animais',
        loadChildren: () =>
          import('../animais/animais.module').then((m) => m.AnimaisPageModule),
      },
      {
        path: 'servicos',
        loadChildren: () =>
          import('../servicos/servicos.module').then((m) => m.ServicosPageModule),
      },
      {
        path: 'pacotes',
        loadChildren: () =>
          import('../pacotes/pacotes.module').then((m) => m.PacotesPageModule),
      },
      {
        path: 'caixa',
        loadChildren: () =>
          import('../caixa/caixa.module').then((m) => m.CaixaPageModule),
      },
      {
        path: 'planos',
        loadChildren: () =>
          import('../planos/planos.module').then((m) => m.PlanosPageModule),
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
