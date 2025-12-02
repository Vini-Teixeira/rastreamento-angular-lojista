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

const isDeliveryActive = (status: DeliveryStatus): boolean => {
  return (
    status !== DeliveryStatus.FINALIZADO &&
    status !== DeliveryStatus.CANCELADO &&
    status !== DeliveryStatus.PENDENTE
  )
}

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
export class DeliveryDetailsModalComponent implements OnInit, OnDestroy, AfterViewInit {
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

  // --- Coordenadas ---
  private coordsLoja!: LatLng;
  private coordsCliente!: LatLng;
  private coordsEntregador: LatLng | null = null;
  private localRouteHistory: LatLng[] = [];

  private lastPlannedRouteFetch: number = 0;
  private readonly RECALCULATE_ROUTE_INTERVAL_MS: number = 30000;

  private hasFittedBounds: boolean = false

  ngOnInit(): void {
    this.coordsLoja = this.getCoords(
      this.entrega.origin.coordinates.coordinates,
    );
    this.coordsCliente = this.getCoords(
      this.entrega.destination.coordinates.coordinates,
    );
    if (this.entrega.driverCurrentLocation) {
      this.coordsEntregador = this.getCoords(
        this.entrega.driverCurrentLocation.coordinates,
      );
    }
    if (this.entrega.routeHistory && this.entrega.routeHistory.length > 0) {
      this.localRouteHistory = this.entrega.routeHistory.map((p) =>
        this.getCoords(p.coordinates),
      );
    }
    this.socketService.joinDeliveryRoom(this.entrega._id);
    this.listenForUpdates();
    setTimeout(() => {
      this.drawRouteByStatus(this.entrega.status);
    }, 500);
  }

  ngAfterViewInit(): void {
    this.dialogRef.afterOpened().subscribe(() => {
      if(this.mapaComponent) {
        this.drawRouteByStatus(this.entrega.status)
        this.hasFittedBounds = true
      }
    })
  }

  ngOnDestroy(): void {
    this.socketService.leaveDeliveryRoom(this.entrega._id);
    this.subscriptions.unsubscribe();
  }

  private listenForUpdates(): void {
    // --- OUVINTE DE MUDANÇA DE STATUS ---
    const statusSub = this.socketService.deliveryUpdated$
      .pipe(filter((data) => data && data.deliveryId === this.entrega._id))
      .subscribe((data) => {
        this.entrega.status = data.status;
        if (!isDeliveryActive(this.entrega.status)) {
            this.mapaComponent.clearDynamicElements();
            this.mapaComponent.updateDriverMarker(null as any);
            this.socketService.leaveDeliveryRoom(this.entrega._id);
            this.snackBar.open('Entrega finalizada. Rastreamento encerrado.', 'OK', { duration: 5000 });
            return;
        }
        if (data.payload?.driverCurrentLocation) {
          this.coordsEntregador = this.getCoords(
            data.payload.driverCurrentLocation.coordinates,
          );
        }
        this.hasFittedBounds = false;
        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });
    // --- OUVINTE DE PULSO DE LOCALIZAÇÃO ---
    const locationSub = this.socketService.locationUpdated$
      .pipe(filter((data) => data && data.deliveryId === this.entrega._id))
      .subscribe((data) => {
        if (!isDeliveryActive(this.entrega.status)) return;
        if (!data.location?.coordinates) return;

        // 1. Atualiza os dados locais
        this.coordsEntregador = this.getCoords(data.location.coordinates);
        if (data.routeHistory && Array.isArray(data.routeHistory)) {
          this.localRouteHistory = data.routeHistory.map((point: any) =>
            this.getCoords(point.coordinates),
          );
        }

        this.updateDynamicRoutes(this.entrega.status);
        this.cdr.detectChanges();
      });

    this.subscriptions.add(statusSub);
    this.subscriptions.add(locationSub);
  }

  private setStaticMarkers(): void {
    if (!this.mapaComponent) return;
    this.mapaComponent.setStaticMarkers(this.coordsLoja, this.coordsCliente);
  }

  /**
   * FAZ UM "FULL REDRAW" DO MAPA.
   * Limpa tudo e redesenha marcadores, histórico E rotas planejadas (caro).
   * Chamado no init e na MUDANÇA DE STATUS.
   */
  private drawRouteByStatus(status: DeliveryStatus): void {
    if (!this.mapaComponent) return;
    console.log(`[Angular] FULL REDRAW (Status: ${status})`);
    this.mapaComponent.clearDynamicElements();
        this.lastPlannedRouteFetch = Date.now();
        this.setStaticMarkers();

    if (this.coordsEntregador) {
      this.mapaComponent.updateDriverMarker(this.coordsEntregador);
    }

    if (this.localRouteHistory.length > 0) {
      this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
    }
    this.drawPlannedRoutes(status);

    if (!this.hasFittedBounds) {
        let boundsCoords = [this.coordsLoja, this.coordsCliente];
        if (this.coordsEntregador) {
          boundsCoords.push(this.coordsEntregador);
        }
        this.mapaComponent.fitBounds(boundsCoords);
        this.hasFittedBounds = true; // Trava o zoom
    }

    let boundsCoords = [this.coordsLoja, this.coordsCliente];
    if (this.coordsEntregador) {
      boundsCoords.push(this.coordsEntregador);
    }
    this.mapaComponent.fitBounds(boundsCoords);
  }
  
  /**
   * Desenha apenas as rotas planejadas (azul, verde, laranja).
   * Este é o método que faz a chamada "cara" à API.
   * (Este método estava aninhado por engano no seu arquivo anterior)
   */
  private drawPlannedRoutes(status: DeliveryStatus): void {
      if (!this.mapaComponent) return;
      
      switch (status) {
      case DeliveryStatus.PENDENTE:
        this.fetchAndDrawPolyline(
          this.coordsLoja,
          this.coordsCliente,
          'orange',
        );
        break;
      case DeliveryStatus.ACEITO:
        if (this.coordsEntregador) {
          // Rota 1: Entregador -> Loja (Dinâmica)
          this.fetchAndDrawPolyline(
            this.coordsEntregador,
            this.coordsLoja,
            'blue',
          );
          // Rota 2: Loja -> Cliente (Estática, tracejada)
          this.fetchAndDrawPolyline(
            this.coordsLoja,
            this.coordsCliente,
            'lightskyblue',
            undefined,
            true
          );
        } else {
           this.fetchAndDrawPolyline(
            this.coordsLoja,
            this.coordsCliente,
            'lightskyblue',
            undefined,
            true
          );
        }
        break;
      case DeliveryStatus.A_CAMINHO:
      case DeliveryStatus.EM_ATENDIMENTO:
        if (this.coordsEntregador) {
          // Rota 1: Entregador -> Cliente (Dinâmica)
          this.fetchAndDrawPolyline(
            this.coordsEntregador,
            this.coordsCliente,
            'green',
          );
        }
        break;
      case DeliveryStatus.FINALIZADO:
      case DeliveryStatus.CANCELADO:
        // Não desenha rotas planejadas
        break;
      default:
        break;
    }
  }


  /**
   * FAZ UM "FAST UPDATE" DO MAPA.
   * Atualiza apenas o marcador e a rota cinza (grátis).
   * Dispara um "Full Redraw" (caro) apenas se o timer do throttle permitir.
   * Chamado a CADA PULSO de localização.
   * (Esta é a nova lógica de throttle)
   */
  private updateDynamicRoutes(status: DeliveryStatus): void {
    if (!this.mapaComponent || !this.coordsEntregador) return;

    const now = Date.now();

    if (now - this.lastPlannedRouteFetch > this.RECALCULATE_ROUTE_INTERVAL_MS) {
      this.drawRouteByStatus(status);
    } else {
      this.mapaComponent.updateDriverMarker(this.coordsEntregador);
      this.mapaComponent.clearHistoryPolylines(); 
      if (this.localRouteHistory.length > 1) {
        // console.log(`[Angular] FAST DRAW: Histórico com ${this.localRouteHistory.length} pontos.`);
        this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
      }
    }
  }

  private fetchAndDrawPolyline(
    origin: LatLng,
    destination: LatLng,
    color: 'orange' | 'blue' | 'green' | 'lightskyblue',
    callback?: (polyline: string) => void,
    dotted: boolean = false,
  ): void {
    if (!origin || !destination) {
      console.warn("fetchAndDrawPolyline: Origem ou destino inválidos.", { origin, destination });
      return;
    }
    
    this.geocodingService.getDirections(origin, destination).subscribe({
      next: (response) => {
        if (response && response.polyline) {
          this.mapaComponent.drawPolyline(response.polyline, color, dotted);
          callback?.(response.polyline);
        } else {
          console.warn(`Polyline recebida estava vazia para ${color}`);
        }
      },
      error: (err) => console.error(`Erro ao buscar polyline ${color}:`, err),
    });
  }


  private getCoords(coords: CoordsTuple): LatLng {
    return { lat: coords[1], lng: coords[0] };
  }

  abrirFoto(url: string): void {
    window.open(url, '_blank');
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
          { duration: 5000 },
        );
      },
    });
  }

  onCancelarEntrega(): void {
    if (
      !confirm(
        'Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.',
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
          { duration: 5000 },
        );
      },
    });
  }
}