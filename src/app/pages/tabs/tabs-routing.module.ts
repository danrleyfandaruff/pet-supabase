import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { RoleGuard } from '../../core/guards/role.guard';

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
      // Tab de ajustes — somente admin e atendente
      {
        path: 'ajustes',
        canActivate: [RoleGuard],
        data: { permissao: 'ver_configuracoes' },
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
        canActivate: [RoleGuard],
        data: { permissao: 'ver_clientes' },
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
        canActivate: [RoleGuard],
        data: { permissao: 'ver_configuracoes' },
        loadChildren: () =>
          import('../servicos/servicos.module').then((m) => m.ServicosPageModule),
      },
      {
        path: 'pacotes',
        canActivate: [RoleGuard],
        data: { permissao: 'ver_configuracoes' },
        loadChildren: () =>
          import('../pacotes/pacotes.module').then((m) => m.PacotesPageModule),
      },
      {
        path: 'caixa',
        canActivate: [RoleGuard],
        data: { permissao: 'ver_caixa' },
        loadChildren: () =>
          import('../caixa/caixa.module').then((m) => m.CaixaPageModule),
      },
      {
        path: 'planos',
        loadChildren: () =>
          import('../planos/planos.module').then((m) => m.PlanosPageModule),
      },
      {
        path: 'relatorios',
        canActivate: [RoleGuard],
        data: { permissao: 'ver_relatorios' },
        loadChildren: () =>
          import('../relatorios/relatorios.module').then((m) => m.RelatoriosPageModule),
      },
      {
        path: 'perfil-cliente',
        loadChildren: () =>
          import('../perfil-cliente/perfil-cliente.module').then((m) => m.PerfilClientePageModule),
      },
      {
        path: 'prontuario',
        loadChildren: () =>
          import('../prontuario/prontuario.module').then((m) => m.ProntuarioPageModule),
      },
      {
        path: 'comissoes',
        canActivate: [RoleGuard],
        data: { permissao: 'ver_relatorios' },
        loadChildren: () =>
          import('../comissoes/comissoes.module').then((m) => m.ComissoesPageModule),
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
