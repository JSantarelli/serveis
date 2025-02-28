import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<{ message: string, severity: string }[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  addNotification(message: string, severity: string) {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, { message, severity }]);

    setTimeout(() => {
      this.removeNotification(0);
    }, 3000);
  }

  removeNotification(index: number) {
    const currentNotifications = this.notificationsSubject.value;
    currentNotifications.splice(index, 1);
    this.notificationsSubject.next([...currentNotifications]);
  }

  clearNotifications() {
    this.notificationsSubject.next([]);
  }
}
