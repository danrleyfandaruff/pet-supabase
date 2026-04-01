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
