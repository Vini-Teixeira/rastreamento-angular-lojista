import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class EntregadoresService {
    private socket: Socket;

    constructor(private ngZone: NgZone) {
        this.socket = io('http://localhost:3000', { path: '/socket.io' });

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
        console.log("Enviando localização para o entregador com ID:", id);
        this.socket.emit('atualizarLocalizacao', { id, lat, lng });
    }
}