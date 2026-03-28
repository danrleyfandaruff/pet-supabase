import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  // Guarda o evento para disparar depois
  private promptEvent: any = null;

  // Observable que diz se o banner deve aparecer
  private podeInstalar$ = new BehaviorSubject<boolean>(false);
  readonly podeInstalar = this.podeInstalar$.asObservable();

  // Já está instalado como PWA?
  readonly jaInstalado = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;

  constructor() {
    // Chrome / Edge / Android — captura o prompt nativo antes de ele aparecer
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault(); // impede o mini-banner automático do browser
      this.promptEvent = event;
      if (!this.jaInstalado) {
        this.podeInstalar$.next(true);
      }
    });

    // Quando o usuário instala por outro meio, esconde o banner
    window.addEventListener('appinstalled', () => {
      this.promptEvent = null;
      this.podeInstalar$.next(false);
    });
  }

  /** Abre o prompt nativo de instalação. Retorna 'accepted' ou 'dismissed'. */
  async instalar(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.promptEvent) return 'unavailable';

    this.promptEvent.prompt();
    const { outcome } = await this.promptEvent.userChoice;
    this.promptEvent = null;
    this.podeInstalar$.next(false);
    return outcome;
  }

  /** Esconde o banner sem instalar (usuário dispensou) */
  dispensar() {
    this.podeInstalar$.next(false);
  }
}
