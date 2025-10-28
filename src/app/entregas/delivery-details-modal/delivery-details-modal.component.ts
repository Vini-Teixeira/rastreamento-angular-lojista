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
import { MapaComponent } from '../../mapa/mapa.component';
import { Delivery, EntregasService } from '../../services/entregas.service';
import { DeliveryStatus } from '../../core/enums/delivery-status.enum';
import {
  GeocodingService,
  LatLng,
} from '../../services/geocoding/geocoding.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

type CoordsTuple = [number, number];

@Component({
  selector: 'app-delivery-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MapaComponent,
  ],
  templateUrl: './delivery-details-modal.component.html',
  styleUrls: ['./delivery-details-modal.component.scss'],
})
export class DeliveryDetailsModalComponent implements OnInit, OnDestroy {
  // --- Injeção de Dependências ---
  private entregasService = inject(EntregasService);
  private snackBar = inject(MatSnackBar);
  private socketService = inject(SocketService);
  private geocodingService = inject(GeocodingService);
  private cdr = inject(ChangeDetectorRef);

  public dialogRef = inject(MatDialogRef<DeliveryDetailsModalComponent>);
  public entrega: Delivery = inject(MAT_DIALOG_DATA);
  @ViewChild(MapaComponent) private mapaComponent!: MapaComponent;
  public DeliveryStatus = DeliveryStatus;
  private subscriptions = new Subscription();

  private coordsLoja!: LatLng;
  private coordsCliente!: LatLng;
  private coordsEntregador: LatLng | null = null;

  private localRouteHistory: LatLng[] = [];

  private polylineRotaEntregadorLoja: string | null = null;
  private polylineRotaLojaCliente: string | null = null;
  private polylineRotaEntregadorCliente: string | null = null;

  ngOnInit(): void {
    this.coordsLoja = this.getCoords(
      this.entrega.origin.coordinates.coordinates
    );
    this.coordsCliente = this.getCoords(
      this.entrega.destination.coordinates.coordinates
    );
    if (this.entrega.driverCurrentLocation) {
      this.coordsEntregador = this.getCoords(
        this.entrega.driverCurrentLocation.coordinates
      );
    }
    this.socketService.joinDeliveryRoom(this.entrega._id);
    this.listenForUpdates();

    setTimeout(() => {
      this.setStaticMarkers();
      this.drawRouteByStatus(this.entrega.status);
    }, 500);
  }

  ngOnDestroy(): void {
    this.socketService.leaveDeliveryRoom(this.entrega._id);
    this.subscriptions.unsubscribe();
  }

  private listenForUpdates(): void {
    const statusSub = this.socketService.deliveryUpdated$
      .pipe(filter((data) => data && data.deliveryId === this.entrega._id))
      .subscribe((data) => {
        console.log('STATUS ATUALIZADO (WS):', data.status);
        this.entrega.status = data.status;
        if (data.payload?.driverCurrentLocation) {
          this.coordsEntregador = this.getCoords(
            data.payload.driverCurrentLocation.coordinates
          );
        }
        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });

    const locationSub = this.socketService.locationUpdated$
      .pipe(filter((data) => data && data.deliveryId === this.entrega._id))
      .subscribe((data) => {
        if (!data.location?.coordinates) return;
                console.log('[Angular] Payload WS [novaLocalizacao]:', data); 

        this.coordsEntregador = this.getCoords(data.location.coordinates);
        if (data.routeHistory && Array.isArray(data.routeHistory)) {
          console.log(`[Angular] HISTÓRICO RECEBIDO: Sim, ${data.routeHistory.length} pontos. Atualizando array local...`);
          this.localRouteHistory = data.routeHistory.map((point: any) =>
            this.getCoords(point.coordinates)
          );
        } else {
          console.warn('[Angular] HISTÓRICO RECEBIDO: Não. O payload não continha um array routeHistory.');
        }
        this.updateDynamicRoutes(this.entrega.status);
      });

    this.subscriptions.add(statusSub);
    this.subscriptions.add(locationSub);
  }

  private setStaticMarkers(): void {
    if (!this.mapaComponent) return;
    this.mapaComponent.setStaticMarkers(this.coordsLoja, this.coordsCliente);
    let boundsCoords = [this.coordsLoja, this.coordsCliente];
    if (this.coordsEntregador) {
      boundsCoords.push(this.coordsEntregador);
    }
    this.mapaComponent.fitBounds(boundsCoords);
  }

  private drawRouteByStatus(status: DeliveryStatus): void {
    if (!this.mapaComponent) return;
    this.mapaComponent.clearDynamicElements();
    this.setStaticMarkers();
    if (this.entrega.routeHistory && this.entrega.routeHistory.length > 0) {
      this.localRouteHistory = this.entrega.routeHistory.map((p) =>
        this.getCoords(p.coordinates)
      );
      this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
    }
    switch (status) {
      case DeliveryStatus.PENDENTE:
        this.fetchAndDrawPolyline(
          this.coordsLoja,
          this.coordsCliente,
          'orange',
          (polyline) => {
            this.polylineRotaLojaCliente = polyline;
          }
        );
        break;
      case DeliveryStatus.ACEITO:
        if (this.coordsEntregador) {
          this.mapaComponent.updateDriverMarker(this.coordsEntregador);
          this.fetchAndDrawPolyline(
            this.coordsEntregador,
            this.coordsLoja,
            'blue',
            (polyline) => {
              this.polylineRotaEntregadorLoja = polyline;
            }
          );
          this.fetchAndDrawPolyline(
            this.coordsLoja,
            this.coordsCliente,
            'lightskyblue',
            (polyline) => {
              this.polylineRotaLojaCliente = polyline;
            },
            true
          );
        }
        break;
      case DeliveryStatus.A_CAMINHO:
      case DeliveryStatus.EM_ATENDIMENTO:
        if (this.coordsEntregador) {
          this.mapaComponent.updateDriverMarker(this.coordsEntregador);
          this.fetchAndDrawPolyline(
            this.coordsEntregador,
            this.coordsCliente,
            'green',
            (polyline) => {
              this.polylineRotaEntregadorCliente = polyline;
            }
          );
        }
        break;
      case DeliveryStatus.FINALIZADO:
        break;
      default:
        break;
    }
  }

  private updateDynamicRoutes(status: DeliveryStatus): void {
    if (!this.mapaComponent || !this.coordsEntregador) return;
    this.mapaComponent.updateDriverMarker(this.coordsEntregador);
    this.mapaComponent.clearHistoryPolylines(); 
    if (this.localRouteHistory.length > 1) {
      console.log(`[Angular] DESENHANDO HISTÓRICO com ${this.localRouteHistory.length} pontos.`);
      this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
    }
  }

  private fetchAndDrawPolyline(
    origin: LatLng,
    destination: LatLng,
    color: 'orange' | 'blue' | 'green' | 'lightskyblue',
    callback: (polyline: string) => void,
    dotted: boolean = false
  ): void {
    this.geocodingService.getDirections(origin, destination).subscribe({
      next: (response) => {
        this.mapaComponent.drawPolyline(response.polyline, color, dotted);
        callback(response.polyline);
      },
      error: (err) => console.error(`Erro ao buscar polyline ${color}:`, err),
    });
  }

  private getCoords(coords: CoordsTuple): LatLng {
    return { lat: coords[1], lng: coords[0] };
  }

  onLiberarCheckIn(): void {
    this.entregasService.liberarCheckInManual(this.entrega._id).subscribe({
      next: (updatedDelivery) => {
        this.snackBar.open('Check-in liberado com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.entrega = updatedDelivery;
      },
      error: (err) => {
        this.snackBar.open(
          `Erro: ${err.error.message || 'Falha ao liberar check-in'}`,
          'Fechar',
          { duration: 5000 }
        );
      },
    });
  }

  onCancelarEntrega(): void {
    if (
      !confirm(
        'Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.'
      )
    ) {
      return;
    }
    this.entregasService.cancelarEntrega(this.entrega._id).subscribe({
      next: () => {
        this.snackBar.open('Entrega cancelada com sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(
          `Erro: ${err.error.message || 'Falha ao cancelar entrega'}`,
          'Fechar',
          { duration: 5000 }
        );
      },
    });
  }
}
