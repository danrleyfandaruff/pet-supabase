import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SearchableSelectComponent } from './searchable-select.component';

/**
 * Módulo compartilhado — componentes reutilizáveis genéricos.
 * Não declare componentes de página aqui para evitar dependências circulares.
 */
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [SearchableSelectComponent],
  exports: [SearchableSelectComponent],
})
export class SharedModule {}
