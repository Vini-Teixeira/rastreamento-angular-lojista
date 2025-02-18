import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class EntregadoresService {
    private socket: Socket;

    constructor(private ngZone: NgZone) {
        this.socket = io('http://localhost:3000', { path: '/socket.io' });

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
        return this.socket;
    }

    enviarLocalizacao(id: string, lat: number, lng: number) {
        console.log('Enviando localização:', { id, lat, lng });
        this.socket.emit('atualizarLocalizacao', { id, lat, lng });
    }
}