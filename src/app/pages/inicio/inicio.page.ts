import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';

interface MenuCard {
  label: string;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage {
  currentUser$: Observable<User | null>;

  cards: MenuCard[] = [
    { label: 'Agenda',        icon: 'calendar',    color: 'primary',   route: '/tabs/atendimentos' },
    { label: 'Tutores',       icon: 'people',       color: 'secondary', route: '/tabs/clientes'     },
    { label: 'Pets',          icon: 'paw',          color: 'success',   route: '/tabs/animais'      },
    { label: 'Serviços',      icon: 'cut',          color: 'tertiary',  route: '/tabs/servicos'     },
    { label: 'Pacotes',       icon: 'gift',         color: 'warning',   route: '/tabs/pacotes'      },
    { label: 'Configurações',icon: 'settings',     color: 'medium',    route: '/tabs/ajustes'      },
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
