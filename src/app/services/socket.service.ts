import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth/auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private authService = inject(AuthService);
  private socket: Socket | undefined;

  private deliveryUpdateSubject = new BehaviorSubject<any>(null);
  public deliveryUpdated$ = this.deliveryUpdateSubject.asObservable();

  private locationUpdateSubject = new BehaviorSubject<any>(null);
  public locationUpdated$ = this.locationUpdateSubject.asObservable();

  constructor() {}

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

    this.socket.on('connect', () => console.log('SocketService: Conectado! ID:', this.socket?.id));
    this.socket.on('disconnect', (reason) => console.warn('SocketService: Desconectado', reason));
    
    this.socket.on('delivery_updated', (data: any) => {
      console.log('SocketService: Evento "delivery_updated" recebido', data);
      this.deliveryUpdateSubject.next(data);
    });
    
    this.socket.on('novaLocalizacao', (data: any) => {
      console.log('SocketService: Evento "novaLocalizacao" recebido!', data);
      if (!data.routeHistory) console.warn('[SocketService] routeHistory ausente no payload!');
      this.locationUpdateSubject.next(data);
    });
  }

  joinDeliveryRoom(deliveryId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_delivery', { deliveryId });
      console.log(`SocketService: A sintonizar na frequência da entrega ${deliveryId}`);
    }
  }

  leaveDeliveryRoom(deliveryId: string): void {
     if (this.socket?.connected) {
      this.socket.emit('leave_delivery', { deliveryId });
      console.log(`SocketService: A sair da frequência da entrega ${deliveryId}`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}

