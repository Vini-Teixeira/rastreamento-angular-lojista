import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { Observable, Subscription, filter, take, switchMap } from 'rxjs';
import { MapLoaderService } from '../services/map-loader.service';
import { PainelEstadoService } from '../services/painel-estado.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  imports: [GoogleMapsModule, CommonModule],
})
// 1. REMOVEMOS O 'OnChanges' DA LISTA DE IMPLEMENTAÇÕES
export class MapaComponent implements OnInit, OnDestroy {
  @ViewChild(GoogleMap) map!: GoogleMap;

  public apiLoaded$: Observable<boolean>;
  private subscriptions = new Subscription();

  public mapOptions: google.maps.MapOptions = {
    center: { lat: -10.9275, lng: -37.0734 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
  };

  public markers: any[] = [];
  public polylines: google.maps.PolylineOptions[] = [];
  private painelEstadoService = inject(PainelEstadoService);
  private mapLoader = inject(MapLoaderService);

  constructor() {
    this.apiLoaded$ = this.mapLoader.apiLoaded$;
  }

  ngOnInit(): void {
    // 2. LÓGICA REATIVA E SEGURA
    // Primeiro, esperamos a API do Google carregar (take(1) garante que isso aconteça só uma vez).
    // Depois (usando switchMap), trocamos para ouvir as seleções de entrega.
    this.subscriptions.add(
      this.apiLoaded$.pipe(
        filter(loaded => loaded),
        take(1),
        switchMap(() => this.painelEstadoService.entregaSelecionada$)
      ).subscribe(entrega => {
        // Esta parte só será executada se a API estiver carregada E uma entrega for selecionada.
        if (entrega) {
          this.atualizarMapaComEntrega(entrega);
        }
      })
    );
  }

  // O MÉTODO ngOnChanges FOI REMOVIDO, POIS NÃO É MAIS NECESSÁRIO

  private atualizarMapaComEntrega(entrega: any): void {
    if (!entrega?.origin?.coordinates?.coordinates || !entrega?.destination?.coordinates?.coordinates) {
        this.markers = [];
        this.polylines = [];
        return;
    }

    const originPos = { lat: entrega.origin.coordinates.coordinates[1], lng: entrega.origin.coordinates.coordinates[0] };
    const destinationPos = { lat: entrega.destination.coordinates.coordinates[1], lng: entrega.destination.coordinates.coordinates[0] };
    const driverPos = entrega.driverCurrentLocation
      ? { lat: entrega.driverCurrentLocation.coordinates[1], lng: entrega.driverCurrentLocation.coordinates[0] }
      : originPos;

    this.markers = [];
    let bounds = new google.maps.LatLngBounds();
    let polylinePath: google.maps.LatLngLiteral[] = [];

    if (entrega.status === 'on_the_way') {
      this.markers.push(this.criarMarcador(driverPos, 'Entregador', 'orange'));
      this.markers.push(this.criarMarcador(destinationPos, 'Destino', 'red'));
      bounds.extend(driverPos);
      bounds.extend(destinationPos);
      polylinePath = [driverPos, destinationPos];
    } else {
      this.markers.push(this.criarMarcador(driverPos, 'Entregador', 'orange'));
      this.markers.push(this.criarMarcador(originPos, 'Origem (Loja)', 'green'));
      this.markers.push(this.criarMarcador(destinationPos, 'Destino', 'red'));
      bounds.extend(driverPos);
      bounds.extend(originPos);
      bounds.extend(destinationPos);
      polylinePath = [driverPos, originPos];
    }
    
    this.polylines = [{
        path: polylinePath,
        strokeColor: '#8e44ad',
        strokeOpacity: 0.8,
        strokeWeight: 4
    }];

    this.map?.fitBounds(bounds);
  }

  private criarMarcador(position: google.maps.LatLngLiteral, title: string, color: 'green' | 'red' | 'orange'): any {
    const colorHex = { green: '#27ae60', red: '#c0392b', orange: '#f39c12' };
    return {
      position,
      title,
      options: {
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: colorHex[color],
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: 'white'
        }
      }
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

