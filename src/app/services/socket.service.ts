import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Notification } from '../core/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private NOTIFICATIONS_KEY = 'rastreamento_notifications_v1';
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private socket: Socket | undefined;

  private deliveryUpdateSubject = new BehaviorSubject<any>(null);
  public deliveryUpdated$ = this.deliveryUpdateSubject.asObservable();

  private socorroUpdateSubject = new BehaviorSubject<any>(null);
  public socorroUpdated$ = this.socorroUpdateSubject.asObservable();

  private locationUpdateSubject = new BehaviorSubject<any>(null);
  public locationUpdated$ = this.locationUpdateSubject.asObservable();

  public notificationsSubject = new BehaviorSubject<Notification[]>(
    this.loadNotificationsFromStorage()
  );
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$: Observable<Notification[]> =
    this.notificationsSubject.asObservable();

  public unreadCount$: Observable<number> =
    this.unreadCountSubject.asObservable();

  constructor() {
    this.recalculateUnreadCount();
  }

  private loadNotificationsFromStorage(): Notification[] {
    try {
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
      return stored ? (JSON.parse(stored) as Notification[]) : [];
    } catch (e) {
      return [];
    }
  }

  private saveNotificationsToStorage(notifications: Notification[]): void {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  private recalculateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  connect(): void {
    const token = this.authService.getToken();
    if (token && !this.socket?.connected) {
      this.socket = io(environment.apiUrl, {
        auth: { token: token },
        transports: ['websocket'],
      });
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () =>
      console.log('SocketService: Conectado! ID:', this.socket?.id)
    );
    this.socket.on('disconnect', (reason) =>
      console.warn('SocketService: Desconectado', reason)
    );

    this.socket.on('delivery_updated', (data: any) => {
      console.log('SocketService: Evento "delivery_updated" recebido', data);
      this.deliveryUpdateSubject.next(data);
    });

    this.socket.on('socorro_updated', (data: any) => {
      console.log('SocketService: Evento "socorro_updated" recebido', data);
      this.socorroUpdateSubject.next(data);
    });

    this.socket.on('novaLocalizacao', (data: any) => {
      console.log('SocketService: Evento "novaLocalizacao" recebido!', data);
      if (!data.routeHistory)
        console.warn('[SocketService] routeHistory ausente no payload!');
      this.locationUpdateSubject.next(data);
    });

    this.socket.on('nova_notificacao_loja', (data: any) => {
      console.log(
        `SocketService: Evento "nova_notificacao_loja" recebido!`,
        data
      );

      const newNotification: Notification = {
        id: crypto.randomUUID(),
        tipo: data.tipo || data.type || 'INFO',
        titulo: data.titulo || data.title || 'Sem título',
        mensagem: data.mensagem || data.message || 'Sem mensagem',
        delivery: data.delivery ?? undefined,
        socorro: data.socorro ?? undefined,
        timestamp: new Date(),
        read: false,
      };

      const currentNotifications = this.notificationsSubject.value;
      const newNotifications = [newNotification, ...currentNotifications];

      this.notificationsSubject.next(newNotifications);
      this.saveNotificationsToStorage(newNotifications);
      this.recalculateUnreadCount();
      this.triggerToast(newNotification);
    });
  }

  private triggerToast(notification: Notification): void {
    const title = notification.titulo;
    const message = notification.mensagem;

    const playSound = (sound: 'alert' | 'info') => {
      const audioFileName = sound === 'alert' ? 'sound' : 'info';
      const audio = new Audio(`assets/sounds/${audioFileName}.mp3`);
      audio
        .play()
        .catch((e) => console.warn(`Não foi possível tocar o som: ${e}`));
    };

    switch (notification.tipo) {
      case 'ERROR':
      case 'WARNING':
        this.toastr.error(message, title, {
          disableTimeOut: true,
          tapToDismiss: false,
        });
        playSound('alert');
        break;
      case 'INFO':
        this.toastr.info(message, title);
        playSound('info');
        break;
      case 'SUCCESS':
        this.toastr.success(message, title);
        break;
    }
  }

  public markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const readNotifications = currentNotifications.map((n) => ({
      ...n,
      read: true,
    }));

    this.notificationsSubject.next(readNotifications);
    this.saveNotificationsToStorage(readNotifications);
    this.recalculateUnreadCount();
  }

  joinDeliveryRoom(deliveryId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_delivery', { deliveryId });
      console.log(
        `SocketService: A sintonizar na frequência da entrega ${deliveryId}`
      );
    }
  }

  leaveDeliveryRoom(deliveryId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_delivery', { deliveryId });
      console.log(
        `SocketService: A sair da frequência da entrega ${deliveryId}`
      );
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
