import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentUser$!: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
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
