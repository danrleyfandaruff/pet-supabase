import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PwaInstallService } from '../core/services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  template: `
    <div class="pwa-banner" *ngIf="visivel" [@slideIn]>
      <div class="pwa-banner-icon">
        <img src="assets/icon/icon-192x192.png" alt="GroomerLab360" />
      </div>
      <div class="pwa-banner-text">
        <span class="pwa-banner-titulo">Instalar GroomerLab360</span>
        <span class="pwa-banner-sub">Acesso rápido na tela inicial</span>
      </div>
      <div class="pwa-banner-acoes">
        <button class="pwa-btn-instalar" (click)="instalar()">Instalar</button>
        <button class="pwa-btn-fechar" (click)="dispensar()" aria-label="Fechar">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .pwa-banner {
      position: fixed;
      bottom: 72px; /* acima da tab bar */
      left: 12px;
      right: 12px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      z-index: 9999;
      animation: slideUp 0.3s cubic-bezier(.34,1.56,.64,1);
    }

    @keyframes slideUp {
      from { transform: translateY(120%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .pwa-banner-icon img {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .pwa-banner-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .pwa-banner-titulo {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .pwa-banner-sub {
      font-size: 12px;
      color: #9aa5b8;
    }

    .pwa-banner-acoes {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .pwa-btn-instalar {
      all: unset;
      background: #3880ff;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
      &:active { opacity: 0.8; }
    }

    .pwa-btn-fechar {
      all: unset;
      font-size: 16px;
      color: #c0c7d0;
      cursor: pointer;
      padding: 4px 6px;
      line-height: 1;
      &:active { color: #888; }
    }
  `],
})
export class PwaInstallBannerComponent implements OnInit, OnDestroy {
  visivel = false;
  private sub?: Subscription;

  constructor(private pwaService: PwaInstallService) {}

  ngOnInit() {
    // Aguarda 3 segundos antes de mostrar — não queremos ser chatos logo de cara
    this.sub = this.pwaService.podeInstalar.subscribe(pode => {
      if (pode) {
        setTimeout(() => { this.visivel = true; }, 3000);
      } else {
        this.visivel = false;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async instalar() {
    const resultado = await this.pwaService.instalar();
    if (resultado === 'accepted') {
      this.visivel = false;
    }
  }

  dispensar() {
    this.visivel = false;
    this.pwaService.dispensar();
  }
}
