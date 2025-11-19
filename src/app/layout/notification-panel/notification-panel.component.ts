import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import {
  Notification,
  NotificationType,
} from '../../core/models/notification.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDividerModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  public notifications$: Observable<Notification[]>;
  private socketService = inject(SocketService);
  private elementRef = inject(ElementRef);
  private closeTimer: any;

  public timeAgoMap = new Map<Notification, string>();
  private timeAgoInterval: any;

  constructor() {
    this.notifications$ = this.socketService.notifications$;
  }

  trackByNotification(index: number, n: Notification) {
    return n.id;
  }

  ngOnInit(): void {
  this.socketService.markAllAsRead();
  this.notifications$.subscribe(() => {
    this.updateTimeAgoSnapshot();
  });
  this.timeAgoInterval = setInterval(() => {
    this.updateTimeAgoSnapshot();
  }, 3000);
}


  ngOnDestroy(): void {
    clearInterval(this.timeAgoInterval);
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  /*public trackByNotification(index: number, notification: Notification): Date {
    return notification.timestamp
  }*/

  getNotificationClass(notification: Notification): string {
    return `type-${notification.tipo.toLowerCase()}`;
  }

  getNotificationIcon(notification: Notification): string {
    switch (notification.tipo) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'SUCCESS':
        return 'check_circle';
      default:
        return 'notifications';
    }
  }

  private updateTimeAgoSnapshot(): void {
  const now = new Date();
  const notifications = this.socketService.notificationsSubject.value;

  notifications.forEach(n => {
    const seconds = Math.floor((now.getTime() - new Date(n.timestamp).getTime()) / 1000);

    let text = '';
    const years = Math.floor(seconds / 31536000);
    const months = Math.floor(seconds / 2592000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60);

    if (years > 0) text = `há ${years}a`;
    else if (months > 0) text = `há ${months}m`;
    else if (days > 0) text = `há ${days}d`;
    else if (hours > 0) text = `há ${hours}h`;
    else if (minutes > 0) text = `há ${minutes} min`;
    else text = 'agora mesmo';

    this.timeAgoMap.set(n, text);
  });
}

}
