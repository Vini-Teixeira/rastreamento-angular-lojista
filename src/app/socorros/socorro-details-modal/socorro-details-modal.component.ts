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

// Função auxiliar para verificar status ativo (Reutilizável ou adaptada para Socorro)
const isSocorroActive = (status: string): boolean => {
  return status !== 'FINALIZADO' && status !== 'CANCELADO';
};

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
    FormatStatusPipe,
  ],
  templateUrl: './socorro-details-modal.component.html',
  styleUrls: ['./socorro-details-modal.component.scss'],
})
export class SocorroDetailsModalComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private socorrosService = inject(SocorrosService);
  private snackBar = inject(MatSnackBar);
  private socketService = inject(SocketService);
  private geocodingService = inject(GeocodingService);
  private cdr = inject(ChangeDetectorRef);

  public dialogRef = inject(MatDialogRef<SocorroDetailsModalComponent>);
  public socorro: Socorro = inject(MAT_DIALOG_DATA);
  public DeliveryStatus = DeliveryStatus;
  public SocorroStatus = SocorroStatus;

  @ViewChild(MapaComponent) private mapaComponent!: MapaComponent;

  private subscriptions = new Subscription();

  private coordsCliente!: LatLng;
  private coordsEntregador: LatLng | null = null;
  private localRouteHistory: LatLng[] = [];

  private lastPlannedRouteFetch: number = 0;
  private readonly RECALCULATE_ROUTE_INTERVAL_MS: number = 30000;

  // Flag para controlar o Zoom inicial
  private hasFittedBounds: boolean = false;

  ngOnInit(): void {
    // 1. Coordenadas do Cliente (Obrigatórias)
    this.coordsCliente = this.getCoords(
      this.socorro.clientLocation.coordinates.coordinates
    );

    // 2. Tenta extrair localização inicial do motorista (Correção do Mapa Pelado)
    if (this.socorro.driverId && typeof this.socorro.driverId === 'object') {
      const driverAny = this.socorro.driverId as any;
      if (driverAny.localizacao && driverAny.localizacao.coordinates) {
        this.coordsEntregador = this.getCoords(
          driverAny.localizacao.coordinates
        );
      }
    }

    // 3. Socket
    this.socketService.joinDeliveryRoom(this.socorro._id);
    this.listenForUpdates();
  }

  ngAfterViewInit(): void {
    // Correção Definitiva do IntersectionObserver: Usa afterOpened
    this.dialogRef.afterOpened().subscribe(() => {
      if (this.mapaComponent) {
        console.log('🚑 Modal Socorro aberto. Iniciando mapa...');
        this.drawRouteByStatus(this.socorro.status);
        this.hasFittedBounds = true; // Marca que já ajustou zoom inicial
      } else {
        console.warn('MapaComponent não encontrado.');
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.leaveDeliveryRoom(this.socorro._id);
    this.subscriptions.unsubscribe();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private listenForUpdates(): void {
    // --- Atualização de Status ---
    const statusSub = this.socketService.socorroUpdated$
      .pipe(filter((data) => data && data.socorroId === this.socorro._id))
      .subscribe((data) => {
        console.log('[Socorro Modal] Status Atualizado:', data.status);
        this.socorro.status = data.status;

        // Kill Switch visual
        if (!isSocorroActive(this.socorro.status)) {
          this.mapaComponent.clearDynamicElements();
          this.mapaComponent.updateDriverMarker(null as any);
          this.socketService.leaveDeliveryRoom(this.socorro._id);
          return;
        }

        if (data.payload?.driverCurrentLocation) {
          // Atualiza se vier no payload do status
          this.coordsEntregador = this.getCoords(
            data.payload.driverCurrentLocation.coordinates
          );
        }

        this.hasFittedBounds = false; // Permite reajuste de zoom se o status mudar
        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });

    // --- Atualização de Localização (GPS) ---
    const locationSub = this.socketService.locationUpdated$
      // Relaxei o filtro de ID aqui igual fizemos na Entrega, confiando na sala
      .pipe(filter((data) => data && data.location))
      .subscribe((data) => {
        if (!isSocorroActive(this.socorro.status)) return;
        if (!data.location?.coordinates) return;

        this.coordsEntregador = this.getCoords(data.location.coordinates);

        if (data.routeHistory && Array.isArray(data.routeHistory)) {
          this.localRouteHistory = data.routeHistory.map((point: any) =>
            this.getCoords(point.coordinates)
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

    if (!this.hasFittedBounds) {
      let boundsCoords = [this.coordsCliente];
      if (this.coordsEntregador) {
        boundsCoords.push(this.coordsEntregador);
      }
      this.mapaComponent.fitBounds(boundsCoords);
      this.hasFittedBounds = true;
    }
  }

  private drawPlannedRoutes(status: string): void {
    if (!this.mapaComponent) return;
    const currentStatus = status?.toUpperCase() || '';
    const activeStatuses = [
      'ACEITO',
      'A_CAMINHO',
      'EM_DESLOCAMENTO',
      'EM_ATENDIMENTO',
    ];

    if (activeStatuses.includes(currentStatus)) {
      if (this.coordsEntregador && this.coordsCliente) {
        console.log('🚑 Desenhando rota Socorro: Motorista -> Cliente');
        this.fetchAndDrawPolyline(
          this.coordsEntregador,
          this.coordsCliente,
          'green'
        );
      } else {
        console.warn('Faltando coordenadas para traçar rota de socorro:', {
          motorista: this.coordsEntregador,
          cliente: this.coordsCliente,
        });
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
    color: 'orange' | 'blue' | 'green' | 'lightskyblue'
  ): void {
    if (!origin || !destination) return;

    this.geocodingService.getDirections(origin, destination).subscribe({
      next: (res) => {
        if (res?.polyline && this.mapaComponent) {
          this.mapaComponent.drawPolyline(res.polyline, color, false);
        }
      },
      error: (err) => console.error(err),
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
