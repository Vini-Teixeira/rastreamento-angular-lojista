import { inject, Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';

export interface Entregador {
  _id: string;
  nome: string;
  email: string;
  ativo: boolean;
  emEntrega: boolean;
  veiculo?: {
    placa: string;
    modelo: string;
  };
}

@Injectable({ providedIn: 'root' })
export class EntregadoresService {
  private socket!: Socket;
  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() {}

  getAvailableDrivers(): Observable<Entregador[]> {
    return this.http.get<Entregador[]>(
      `${this.apiUrl}/entregadores/available`,
      {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` },
      }
    );
  }

  connectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Socket.IO: Token de autenticação não encontrado.');
      return;
    }

    this.socket = io(environment.apiUrl, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Conectado ao servidor Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor Socket.IO');
    });

    this.socket.on('novaLocalizacao', (data) => {
      this.ngZone.run(() => {
        console.log('Nova localização recebida:', data);
      });
    });
  }

  getSocket(): Socket {
    if (!this.socket || !this.socket.connected) {
      this.connectSocket();
    }
    return this.socket;
  }

  enviarLocalizacao(lat: number, lng: number) {
    if (this.socket?.connected) {
      this.socket.emit('atualizarLocalizacao', { lat, lng });
    }
  }

  disconnectSocket() {
    this.socket?.disconnect();
  }
}
