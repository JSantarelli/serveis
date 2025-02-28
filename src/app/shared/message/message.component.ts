import { Component } from '@angular/core';
import { NotificationService } from './../../../core/services/mensajes.service';
import { CardComponent } from '../card/card.component';
import { LabelComponent } from '../label/label.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [
    CardComponent,
    LabelComponent,
    CommonModule
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})

export class MessageComponent {
  showConfirmMsg = false;
  showErrorMsg = false;
  hide = true;
  notifications: { message: string, severity: string }[] = [];

  constructor(private notificationService: NotificationService) {
    this.notificationService.notifications$.subscribe(
      (messages) => {
        this.notifications = messages;
      }
    );
  }
  
  dismissNotification(index: number) {
    this.notificationService.removeNotification(index);
  }
}