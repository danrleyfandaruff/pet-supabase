import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
})
export class TabsPage {
  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  async onLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Sair',
      message: 'Deseja sair da sua conta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => {
            this.authService.logout().subscribe(() => {
              this.router.navigate(['/login'], { replaceUrl: true });
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
