import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable, lastValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentUser$!: Observable<User | null>;

  resumoIA = '';
  resumoCarregando = true; // inicia carregando para mostrar spinner imediatamente
  resumoErro = false;

  // Assinatura / trial
  assinaturaStatus: any = null;
  mostrarBannerTrial = false;
  diasRestantesTrial = 0;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
    this.carregarResumo();
    this.carregarAssinaturaStatus();
  }

  async carregarAssinaturaStatus() {
    try {
      const status = await lastValueFrom(this.apiService.getAssinaturaStatus());
      this.assinaturaStatus = status;
      if (status.status === 'trial' && status.diasRestantes !== null) {
        this.diasRestantesTrial = status.diasRestantes;
        this.mostrarBannerTrial = true;
      }
    } catch {
      // ignora — não bloqueia a home
    }
  }

  irParaAssinatura() {
    this.router.navigate(['/assinatura']);
  }

  async carregarResumo() {
    this.resumoCarregando = true;
    this.resumoErro = false;
    try {
      const res = await lastValueFrom(this.apiService.getResumoDia());
      this.resumoIA = res.resumo;
    } catch {
      this.resumoErro = true;
    } finally {
      this.resumoCarregando = false;
    }
  }

  async onLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Sair',
      message: 'Tem certeza que deseja sair da sua conta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => this.performLogout(),
        },
      ],
    });
    await alert.present();
  }

  private async performLogout(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Saindo...',
      spinner: 'crescent',
      duration: 1500,
    });
    await loading.present();

    this.authService.logout().subscribe({
      next: async () => {
        await loading.dismiss();
        await this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: async () => {
        await loading.dismiss();
        await this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }
}
