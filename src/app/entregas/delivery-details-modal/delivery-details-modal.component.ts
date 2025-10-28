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
import { GeocodingService, LatLng } from '../../services/geocoding/geocoding.service';
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

  public dialogRef = inject(MatDialogRef<DeliveryDetailsModalComponent>)
  public entrega: Delivery = inject(MAT_DIALOG_DATA)
  @ViewChild(MapaComponent) private mapaComponent!: MapaComponent;
  public DeliveryStatus = DeliveryStatus
  private subscriptions = new Subscription()

  private coordsLoja!: LatLng
  private coordsCliente!: LatLng 
  private coordsEntregador: LatLng | null = null;

  ngOnInit(): void {
    this.coordsLoja = this.getCoords(this.entrega.origin.coordinates.coordinates);
    this.coordsCliente = this.getCoords(this.entrega.destination.coordinates.coordinates);
    if (this.entrega.driverCurrentLocation) {
      this.coordsEntregador = this.getCoords(this.entrega.driverCurrentLocation.coordinates);
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
      .pipe(
        filter(data => data && data.deliveryId === this.entrega._id)
      )
      .subscribe(data => {
        console.log('STATUS ATUALIZADO (WS):', data.status);
        this.entrega.status = data.status;
        if (data.payload?.driverCurrentLocation) {
           this.coordsEntregador = this.getCoords(data.payload.driverCurrentLocation.coordinates);
        }
        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });

    const locationSub = this.socketService.locationUpdated$
      .pipe(
        filter(data => data && data.deliveryId === this.entrega._id)
      )
      .subscribe(data => {
        console.warn('*** EVENTO DE LOCALIZAÇÃO RECEBIDO DO WS ***')
        if (!data.location?.coordinates) return;
        console.log('LOCALIZAÇÃO ATUALIZADA (WS):', data.location.coordinates);
        this.coordsEntregador = this.getCoords(data.location.coordinates);
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
    switch (status) {
      case DeliveryStatus.PENDENTE:
        this.fetchAndDrawPolyline(this.coordsLoja, this.coordsCliente, 'orange');
        break;

      case DeliveryStatus.ACEITO:
        if (this.coordsEntregador) {
          this.mapaComponent.updateDriverMarker(this.coordsEntregador);
          this.fetchAndDrawPolyline(this.coordsEntregador, this.coordsLoja, 'blue');
          this.fetchAndDrawPolyline(this.coordsLoja, this.coordsCliente, 'gray');
        }
        break;

      case DeliveryStatus.A_CAMINHO:
      case DeliveryStatus.EM_ATENDIMENTO:
        if (this.coordsEntregador) {
          this.mapaComponent.updateDriverMarker(this.coordsEntregador);
          this.fetchAndDrawPolyline(this.coordsEntregador, this.coordsCliente, 'green');
        }
        break;
      default:
        break;
    }
    this.setStaticMarkers();
  }

  private updateDynamicRoutes(status: DeliveryStatus): void {
    if (!this.mapaComponent || !this.coordsEntregador) return;
    this.mapaComponent.clearDynamicElements(); 
    this.mapaComponent.updateDriverMarker(this.coordsEntregador);
        if (status === DeliveryStatus.ACEITO) {
      this.fetchAndDrawPolyline(this.coordsEntregador, this.coordsLoja, 'blue');
      this.fetchAndDrawPolyline(this.coordsLoja, this.coordsCliente, 'gray');
    } else if (status === DeliveryStatus.A_CAMINHO || status === DeliveryStatus.EM_ATENDIMENTO) {
      this.fetchAndDrawPolyline(this.coordsEntregador, this.coordsCliente, 'green');
    }
  }

  private fetchAndDrawPolyline(
    origin: LatLng,
    destination: LatLng,
    color: 'orange' | 'blue' | 'green' | 'gray'
  ): void {
    this.geocodingService.getDirections(origin, destination).subscribe({
      next: (response) => {
        this.mapaComponent.drawPolyline(response.polyline, color);
      },
      error: (err) => console.error(`Erro ao buscar polyline ${color}:`, err)
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