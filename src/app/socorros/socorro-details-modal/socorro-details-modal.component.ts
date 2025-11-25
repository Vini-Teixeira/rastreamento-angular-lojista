import {
  Component,
  inject,
  OnInit,
  OnDestroy,
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
export class SocorroDetailsModalComponent implements OnInit, OnDestroy {
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
    // 1. Configura coordenadas iniciais
    this.coordsCliente = this.getCoords(
      this.socorro.clientLocation.coordinates.coordinates
    );

    // (Socorro geralmente não tem locationHistory salvo no objeto principal
    //  da mesma forma que entrega, a menos que tenhamos adicionado. 
    //  Se tiver driverCurrentLocation, usamos.)
    if (this.socorro.driverId && typeof this.socorro.driverId === 'object') {
        // Se o objeto driver vier populado com localização, poderíamos usar.
        // Mas vamos confiar no Socket para a primeira atualização.
    }

    this.socketService.joinDeliveryRoom(this.socorro._id); // Usa o mesmo método (sala por ID)
    this.listenForUpdates();

    setTimeout(() => {
      this.drawRouteByStatus(this.socorro.status);
    }, 500);
  }

  ngOnDestroy(): void {
    this.socketService.leaveDeliveryRoom(this.socorro._id);
    this.subscriptions.unsubscribe();
  }
  
  onClose(): void {
    this.dialogRef.close();
  }

  private listenForUpdates(): void {
    // 1. Status Update (socorro_updated)
    const statusSub = this.socketService.socorroUpdated$
      .pipe(filter((data) => data && data.socorroId === this.socorro._id))
      .subscribe((data) => {
        console.log('[Socorro Modal] Status Atualizado:', data.status);
        this.socorro.status = data.status;
        
        // Se o payload vier com localização, atualizamos
        if (data.payload?.driverCurrentLocation) {
             // Lógica similar à de entrega se o backend mandar
        }

        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });

    // 2. Location Update (novaLocalizacao)
    // O backend emite 'novaLocalizacao' com 'deliveryId' igual ao ID do socorro
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
    
    // Normaliza status para comparar com Enum
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

    // Fit bounds
    let boundsCoords = [this.coordsCliente];
    if (this.coordsEntregador) {
      boundsCoords.push(this.coordsEntregador);
    }
    // Se só tiver o cliente, o fitBounds centraliza nele.
    this.mapaComponent.fitBounds(boundsCoords);
  }

  private drawPlannedRoutes(status: string): void {
    if (!this.mapaComponent) return;

    // Lógica de Rota para Socorro
    if (status === 'A_CAMINHO' || status === 'ACEITO' || status === 'EM_DESLOCAMENTO') {
        if (this.coordsEntregador) {
            // Rota: Entregador -> Cliente (Azul/Verde)
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
     // Reutiliza a mesma lógica do modal de entregas
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