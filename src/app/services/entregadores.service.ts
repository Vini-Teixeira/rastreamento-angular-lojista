import { inject, Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EntregadoresService {
    private socket!: Socket;
    private ngZone = inject(NgZone);
    private authService = inject(AuthService);

    constructor() {}

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
            auth: { token }
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