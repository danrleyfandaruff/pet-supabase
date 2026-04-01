import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

const routes: Routes = [
  // Rota padrão — redireciona para tabs (app principal)
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },

  // Rotas públicas (somente para não-autenticados)
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then((m) => m.RegisterPageModule),
    canActivate: [NoAuthGuard],
  },

  // App principal com tabs (protegido)
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),
    canActivate: [AuthGuard],
  },

  // Manual de uso
  {
    path: 'manual',
    loadChildren: () =>
      import('./pages/manual/manual.module').then((m) => m.ManualPageModule),
    canActivate: [AuthGuard],
  },

  // Página de assinatura/paywall (acessível mesmo com assinatura expirada)
  {
    path: 'assinatura',
    loadChildren: () =>
      import('./pages/assinatura/assinatura.module').then((m) => m.AssinaturaPageModule),
    canActivate: [AuthGuard],
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'tabs',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: undefined })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
