import { CommonModule } from '@angular/common';
import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { EntregadoresService } from '../services/entregadores.service';

@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.css'],
    imports: [GoogleMapsModule, CommonModule],
})
export class MapaComponent implements OnInit, OnDestroy {
    entregadores: any[] = [];
    private intervalId: any;

    constructor(
        private ngZone: NgZone,
        private entregadoresService: EntregadoresService
    ) {}

    ngOnInit() {
        this.entregadoresService.getSocket().on('novaLocalizacao', (data) => {
            this.ngZone.run(() => {
                const index = this.entregadores.findIndex((e) => e.id === data.id);
                if (index !== -1) {
                    this.entregadores[index] = data;
                } else {
                    this.entregadores.push(data);
                }
            });
        });

        this.intervalId = setInterval(() => {
            const entregadorId = '67ae61d1b7acad3a554f4a7d';
            const lat = -23.5505 + Math.random() * 0.01;
            const lng = -46.6333 + Math.random() * 0.01;

            this.entregadoresService.enviarLocalizacao(entregadorId, lat, lng);
        }, 1000);
    }

    ngOnDestroy() {
        clearInterval(this.intervalId);
    }
}