import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  inject,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { Observable } from 'rxjs';
import { MapLoaderService } from '../services/map-loader.service';

function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  if (!encoded) {
    return [];
  }
  let points: google.maps.LatLngLiteral[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;
  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  imports: [GoogleMapsModule, CommonModule],
})
export class MapaComponent implements AfterViewInit {
  @ViewChild(GoogleMap) private mapInstanceRef!: GoogleMap;
  private mapInstance: google.maps.Map | undefined;

  public historyPolylineOptions: google.maps.PolylineOptions | null = null;
  public historyPolylinePath: google.maps.LatLngLiteral[] = [];
  
  public apiLoaded$: Observable<boolean>;
  private mapLoader = inject(MapLoaderService);
  private cdr = inject(ChangeDetectorRef);

  public mapOptions: google.maps.MapOptions = {
    center: { lat: -10.9275, lng: -37.0734 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
  };

  public clearHistoryPolylines() {
    this.historyPolylineOptions = null;
    this.historyPolylinePath = [];
    this.cdr.detectChanges();
  }

  public drawHistoryPolyline(path: google.maps.LatLngLiteral[], color: 'gray') {
    this.historyPolylineOptions = {
      path: path,
      strokeColor: color,
      strokeOpacity: 0.7,
      strokeWeight: 9,
      zIndex: 2
    };
    this.historyPolylinePath = path;
    this.cdr.detectChanges();
  }

  public staticMarkerPositions: google.maps.LatLngLiteral[] = [];
  public driverMarkerPosition: google.maps.LatLngLiteral | null = null;
  public polylinePaths: google.maps.LatLngLiteral[][] = [];
  public polylineOptions: google.maps.PolylineOptions[] = [];

  public iconLoja = { url: 'assets/icons/store.png', scaledSize: new google.maps.Size(50, 50) };
  public iconCliente = { url: 'assets/icons/client.png', scaledSize: new google.maps.Size(50, 50) };
  public iconDriver = { url: 'assets/icons/driver-moto.png', scaledSize: new google.maps.Size(50, 50) };

  constructor() {
    this.apiLoaded$ = this.mapLoader.apiLoaded$;
  }
  
  ngAfterViewInit(): void {
    this.apiLoaded$.subscribe(loaded => {
      if (loaded && this.mapInstanceRef) {
        this.mapInstance = this.mapInstanceRef.googleMap;
      }
    });
  }

  public setStaticMarkers(loja: google.maps.LatLngLiteral, cliente: google.maps.LatLngLiteral) {
    this.staticMarkerPositions = [loja, cliente];
    this.cdr.detectChanges();
  }

  public drawPolyline(
    polylineString: string,
    color: 'orange' | 'blue' | 'green' | 'gray' | 'lightskyblue', 
    dotted: boolean = false
  ) {
    const path = decodePolyline(polylineString);
    let icon: google.maps.Symbol | undefined = undefined;
    if (dotted) {
      icon = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeWeight: 4,
        scale: 4,
      };
    }
    this.polylineOptions.push({
      path: path,
      strokeColor: color,
      strokeOpacity: dotted ? 0 : 1.0,
      strokeWeight: 8,
      icons: dotted ? [{ icon: icon, offset: '0', repeat: '20px' }] : undefined,
      zIndex: 1
    });
    
    this.polylinePaths = this.polylineOptions.map(p => p.path as google.maps.LatLngLiteral[]);
    this.cdr.detectChanges();
  }

  public updateDriverMarker(position: google.maps.LatLngLiteral) {
    this.driverMarkerPosition = position;
    this.cdr.detectChanges();
  }

  public clearDynamicElements() {
    this.polylineOptions = [];
    this.polylinePaths = [];
    this.clearHistoryPolylines();
    this.cdr.detectChanges();
  }

  public fitBounds(coords: google.maps.LatLngLiteral[]) {
    if (!this.mapInstance || coords.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    coords.forEach(pos => bounds.extend(pos));
    
    this.mapInstance.fitBounds(bounds, 40);
  }
}