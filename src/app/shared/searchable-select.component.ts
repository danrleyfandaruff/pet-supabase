import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface SelectItem {
  id: any;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
})
export class SearchableSelectComponent {
  @Input() items: SelectItem[] = [];
  @Input() title = 'Selecionar';

  searchTerm = '';

  constructor(private modalCtrl: ModalController) {}

  get filtered(): SelectItem[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(i => i.label.toLowerCase().includes(q));
  }

  select(item: SelectItem) {
    this.modalCtrl.dismiss(item);
  }

  dismiss() {
    this.modalCtrl.dismiss(null);
  }
}
