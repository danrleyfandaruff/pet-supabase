import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  calendar, people, paw, cut, gift, settings, cash,
  cashOutline, arrowDownCircleOutline, arrowUpCircleOutline,
  arrowDownOutline, arrowUpOutline, walletOutline,
  calendarOutline, createOutline, trashOutline, cutOutline,
  giftOutline, homeOutline, settingsOutline, logOutOutline,
  addOutline, chevronBackOutline, chevronForwardOutline,
  closeCircleOutline, searchOutline, refreshOutline,
  timeOutline, personOutline, checkmarkCircleOutline,
  pawOutline, add, arrowBackOutline, arrowForwardOutline,
  checkmarkOutline, bookOutline, flagOutline,
  checkmarkDoneOutline, closeOutline, ellipseOutline,
  arrowUndoOutline, addCircleOutline, pricetagOutline,
  layersOutline, lockClosedOutline, chevronDownOutline,
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  isReady$: Observable<boolean>;

  constructor(private authService: AuthService) {
    addIcons({
      calendar, people, paw, cut, gift, settings, cash,
      cashOutline, arrowDownCircleOutline, arrowUpCircleOutline,
      arrowDownOutline, arrowUpOutline, walletOutline,
      calendarOutline, createOutline, trashOutline, cutOutline,
      giftOutline, homeOutline, settingsOutline, logOutOutline,
      addOutline, chevronBackOutline, chevronForwardOutline,
      closeCircleOutline, searchOutline, refreshOutline,
      timeOutline, personOutline, checkmarkCircleOutline,
      pawOutline, add, arrowBackOutline, arrowForwardOutline,
      checkmarkOutline, bookOutline, flagOutline,
      checkmarkDoneOutline, closeOutline, ellipseOutline,
      arrowUndoOutline, addCircleOutline, pricetagOutline,
      layersOutline, lockClosedOutline, chevronDownOutline,
    });
    this.isReady$ = this.authService.isReady$;
  }

  ngOnInit(): void {}
}
