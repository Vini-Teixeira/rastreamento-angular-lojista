import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MapaComponent } from '../../mapa/mapa.component';
import { SocorrosService } from '../../services/socorro.service';
import { Socorro } from '../../models/socorro.model';
import { DeliveryStatus } from '../../core/enums/delivery-status.enum';
import { SocorroStatus } from '../../core/enums/socorro-status.enum';
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';
import {
  GeocodingService,
  LatLng,
} from '../../services/geocoding/geocoding.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

type CoordsTuple = [number, number];

@Component({
  selector: 'app-socorro-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MapaComponent,
    FormatStatusPipe
  ],
  templateUrl: './socorro-details-modal.component.html',
  styleUrls: ['./socorro-details-modal.component.scss'],
})
export class SocorroDetailsModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private socorrosService = inject(SocorrosService);
  private snackBar = inject(MatSnackBar);
  private socketService = inject(SocketService);
  private geocodingService = inject(GeocodingService);
  private cdr = inject(ChangeDetectorRef);

  public dialogRef = inject(MatDialogRef<SocorroDetailsModalComponent>);
  public socorro: Socorro = inject(MAT_DIALOG_DATA);
  public DeliveryStatus = DeliveryStatus
  public SocorroStatus = SocorroStatus
  
  @ViewChild(MapaComponent) private mapaComponent!: MapaComponent;
  
  private subscriptions = new Subscription();

  private coordsCliente!: LatLng;
  private coordsEntregador: LatLng | null = null;
  private localRouteHistory: LatLng[] = [];

  private lastPlannedRouteFetch: number = 0;
  private readonly RECALCULATE_ROUTE_INTERVAL_MS: number = 30000;

  ngOnInit(): void {
    this.coordsCliente = this.getCoords(
      this.socorro.clientLocation.coordinates.coordinates
    );
    if (this.socorro.driverId && typeof this.socorro.driverId === 'object') {
    }
    this.socketService.joinDeliveryRoom(this.socorro._id);
    this.listenForUpdates();

    /*setTimeout(() => {
      this.drawRouteByStatus(this.socorro.status);
    }, 500);*/
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.mapaComponent) {
        console.log('Iniciando mapa do Socorro...');
        this.drawRouteByStatus(this.socorro.status);
      } else {
        console.warn('MapaComponent ainda não disponível no AfterViewInit.');
      }
    }, 400);
  }

  ngOnDestroy(): void {
    this.socketService.leaveDeliveryRoom(this.socorro._id);
    this.subscriptions.unsubscribe();
  }
  
  onClose(): void {
    this.dialogRef.close();
  }

  private listenForUpdates(): void {
    const statusSub = this.socketService.socorroUpdated$
      .pipe(filter((data) => data && data.socorroId === this.socorro._id))
      .subscribe((data) => {
        console.log('[Socorro Modal] Status Atualizado:', data.status);
        this.socorro.status = data.status;
        if (data.payload?.driverCurrentLocation) {
        }

        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });
    const locationSub = this.socketService.locationUpdated$
      .pipe(filter((data) => data && data.deliveryId === this.socorro._id))
      .subscribe((data) => {
        if (!data.location?.coordinates) return;

        this.coordsEntregador = this.getCoords(data.location.coordinates);
        
        if (data.routeHistory && Array.isArray(data.routeHistory)) {
          this.localRouteHistory = data.routeHistory.map((point: any) =>
            this.getCoords(point.coordinates),
          );
        }

        this.updateDynamicRoutes(this.socorro.status);
        this.cdr.detectChanges();
      });

    this.subscriptions.add(statusSub);
    this.subscriptions.add(locationSub);
  }

  private setStaticMarkers(): void {
    if (!this.mapaComponent) return;
    this.mapaComponent.setStaticMarkers(null as any, this.coordsCliente);
  }

  private drawRouteByStatus(status: string): void {
    if (!this.mapaComponent) return;
    const statusUpper = status.toUpperCase();
    this.mapaComponent.clearDynamicElements();
    this.lastPlannedRouteFetch = Date.now();
    this.setStaticMarkers();

    if (this.coordsEntregador) {
      this.mapaComponent.updateDriverMarker(this.coordsEntregador);
    }

    if (this.localRouteHistory.length > 0) {
      this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
    }
    this.drawPlannedRoutes(statusUpper);
    let boundsCoords = [this.coordsCliente];
    if (this.coordsEntregador) {
      boundsCoords.push(this.coordsEntregador);
    }
    this.mapaComponent.fitBounds(boundsCoords);
  }

  private drawPlannedRoutes(status: string): void {
    if (!this.mapaComponent) return;
    if (status === 'A_CAMINHO' || status === 'ACEITO' || status === 'EM_DESLOCAMENTO') {
        if (this.coordsEntregador) {
            this.fetchAndDrawPolyline(
                this.coordsEntregador,
                this.coordsCliente,
                'green' 
            );
        }
    }
  }

  private updateDynamicRoutes(status: string): void {
    if (!this.mapaComponent || !this.coordsEntregador) return;
    const now = Date.now();
    if (now - this.lastPlannedRouteFetch > this.RECALCULATE_ROUTE_INTERVAL_MS) {
      this.drawRouteByStatus(status);
    } else {
      this.mapaComponent.updateDriverMarker(this.coordsEntregador);
      this.mapaComponent.clearHistoryPolylines(); 
      if (this.localRouteHistory.length > 1) {
        this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
      }
    }
  }

  private fetchAndDrawPolyline(
    origin: LatLng,
    destination: LatLng,
    color: 'orange' | 'blue' | 'green' | 'lightskyblue',
  ): void {
     if (!origin || !destination) return;
     this.geocodingService.getDirections(origin, destination).subscribe({
        next: (res) => {
            if (res?.polyline) {
                this.mapaComponent.drawPolyline(res.polyline, color, false);
            }
        },
        error: (err) => console.error(err)
     });
  }

  private getCoords(coords: CoordsTuple): LatLng {
    return { lat: coords[1], lng: coords[0] };
  }

  abrirFoto(url: string): void {
    window.open(url, '_blank');
  }

  onCancelarSocorro(): void {
    if (!confirm('Tem certeza que deseja cancelar este socorro?')) return;
  }
}