import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SearchableSelectComponent } from './searchable-select.component';
import { PwaInstallBannerComponent } from './pwa-install-banner.component';

/**
 * Módulo compartilhado — componentes reutilizáveis genéricos.
 * Não declare componentes de página aqui para evitar dependências circulares.
 */
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [SearchableSelectComponent, PwaInstallBannerComponent],
  exports: [SearchableSelectComponent, PwaInstallBannerComponent],
})
export class SharedModule {}
