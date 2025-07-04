import { Component, OnDestroy, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { LocationService } from '../services/location.service';
import { RastreamentoService } from '../services/rastreamento.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.scss'],
    imports: [GoogleMapsModule, CommonModule],
})
export class MapaComponent implements OnInit, OnDestroy {
    entregadores: google.maps.LatLng[] = [];
    mapOptions: google.maps.MapOptions = {
        center: { lat: -10.904430311434286, lng: -37.102888047735966 },
        zoom: 15,
    };

    entregadorLocation: google.maps.LatLng;
    private entregadorSubscription: Subscription | undefined;
    telefoneEntregador: string = '79 9 9671-5754';
    @Output() entregaSelecionada = new EventEmitter<string>();

    @ViewChild(GoogleMap) mapComponent: GoogleMap | undefined;

    constructor(private locationService: LocationService, private rastreamentoService: RastreamentoService) {
        this.entregadorLocation = new google.maps.LatLng({ lat: -10.904430311434286, lng: -37.102888047735966 });
    }

    ngOnInit() {
        const cachedLocation = this.locationService.getLocation();
        if (cachedLocation) {
            this.entregadores = [cachedLocation];
            this.mapOptions = {
                center: cachedLocation,
                zoom: 15,
            };
        } else {
            this.getUserLocation();
        }
        this.iniciarRastreamento();
    }

    ngOnDestroy() {
        if (this.entregadorSubscription) {
            this.entregadorSubscription.unsubscribe();
        }
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = new google.maps.LatLng(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    this.entregadores = [userLocation];
                    this.mapOptions = {
                        center: userLocation,
                        zoom: 15,
                    };
                    this.locationService.setLocation(userLocation);
                },
                (error) => {
                    console.error('Erro ao obter a localização do usuário:', error);
                }
            );
        } else {
            console.error('Geolocalização não disponível');
        }
    }

    iniciarRastreamento() {
        this.entregadorSubscription = this.rastreamentoService.entregadorLocation$.subscribe((location) => {
            this.entregadorLocation = location;
        });
        this.rastreamentoService.iniciarRastreamento(this.telefoneEntregador);
    }

    carregarMarcadoresDeEntregas(entregas: any[]): void {
        entregas.forEach(entrega => {
            if (this.mapComponent?.googleMap) {
                const marker = new google.maps.Marker({
                    position: { lat: entrega.lat, lng: entrega.lng },
                    map: this.mapComponent.googleMap,
                    title: `Entrega ${entrega.id}`,
                });

                marker.addListener('click', () => {
                    this.entregaSelecionada.emit(entrega.id);
                });
            }
        });
    }
    onMapInitialized(mapInstance: GoogleMap): void {
    }
}