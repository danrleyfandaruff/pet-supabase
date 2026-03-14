import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ManualRoutingModule } from './manual-routing.module';
import { ManualPage } from './manual.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, ManualRoutingModule],
  declarations: [ManualPage],
})
export class ManualPageModule {}
