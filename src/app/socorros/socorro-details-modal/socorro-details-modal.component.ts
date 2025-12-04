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
import { SocorroStatus } from '../../core/enums/socorro-status.enum'; // Garanta que este enum existe
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';
import {
  GeocodingService,
  LatLng,
} from '../../services/geocoding/geocoding.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Helper para saber se o mapa deve continuar atualizando
const isSocorroActive = (status: string): boolean => {
  return (
    status !== 'FINALIZADO' && status !== 'CANCELADO' && status !== 'REJEITADO'
  );
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
  // --- Injeção de Dependências ---
  private socorrosService = inject(SocorrosService);
  private snackBar = inject(MatSnackBar);
  private socketService = inject(SocketService);
  private geocodingService = inject(GeocodingService);
  private cdr = inject(ChangeDetectorRef);

  public dialogRef = inject(MatDialogRef<SocorroDetailsModalComponent>);
  public socorro: Socorro = inject(MAT_DIALOG_DATA);

  // Disponibiliza o Enum para o HTML se necessário
  public SocorroStatus = SocorroStatus;

  @ViewChild(MapaComponent) private mapaComponent!: MapaComponent;

  private subscriptions = new Subscription();

  // --- Coordenadas ---
  private coordsCliente!: LatLng;
  private coordsEntregador: LatLng | null = null;
  private localRouteHistory: LatLng[] = [];

  // --- Controle de Performance e UX ---
  private lastPlannedRouteFetch: number = 0;
  private readonly RECALCULATE_ROUTE_INTERVAL_MS: number = 30000; // 30s
  private hasFittedBounds: boolean = false; // Impede o zoom de ficar pulando

  ngOnInit(): void {
    // 1. Extrai coordenadas do Cliente
    this.coordsCliente = this.getCoords(
      this.socorro.clientLocation.coordinates.coordinates
    );

    // 2. Tenta extrair coordenadas iniciais do Motorista (se vier populado)
    // Verifica se driverId é objeto e tem location ou se veio no payload de criação
    if (this.socorro.driverId && typeof this.socorro.driverId === 'object') {
      const driverObj = this.socorro.driverId as any;
      if (driverObj.localizacao?.coordinates) {
        this.coordsEntregador = this.getCoords(
          driverObj.localizacao.coordinates
        );
      }
    }
    // Fallback: Verifica se o objeto socorro raiz tem 'driverCurrentLocation' (nosso patch do backend)
    else if ((this.socorro as any).driverCurrentLocation?.coordinates) {
      this.coordsEntregador = this.getCoords(
        (this.socorro as any).driverCurrentLocation.coordinates
      );
    }

    // 3. Conecta ao Socket
    this.socketService.joinDeliveryRoom(this.socorro._id);
    this.listenForUpdates();
  }

  ngAfterViewInit(): void {
    // Espera o Modal abrir para iniciar o mapa (Resolve erro IntersectionObserver)
    this.dialogRef.afterOpened().subscribe(() => {
      if (this.mapaComponent) {
        console.log('🚑 Modal Socorro aberto. Iniciando mapa...');
        this.drawRouteByStatus(this.socorro.status);
        this.hasFittedBounds = true; // Marca zoom inicial como feito
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
    // --- Evento de Mudança de Status ---
    const statusSub = this.socketService.socorroUpdated$
      .pipe(filter((data) => data && data.socorroId === this.socorro._id))
      .subscribe((data) => {
        console.log('[Socorro Modal] Status Atualizado:', data.status);
        this.socorro.status = data.status;

        // Kill Switch: Se acabou, para de atualizar o mapa
        if (!isSocorroActive(this.socorro.status)) {
          this.mapaComponent.clearDynamicElements();
          this.mapaComponent.updateDriverMarker(null as any);
          this.socketService.leaveDeliveryRoom(this.socorro._id);
          this.snackBar.open('Socorro finalizado/cancelado.', 'OK', {
            duration: 4000,
          });
          return;
        }

        // Atualiza posição se vier no payload do status
        // (Tentativa resiliente de pegar de payload.driverCurrentLocation OU raiz)
        const driverLoc =
          data.payload?.driverCurrentLocation || data.driverCurrentLocation;
        if (driverLoc?.coordinates) {
          this.coordsEntregador = this.getCoords(driverLoc.coordinates);
        }

        // Status mudou -> Pode refazer o fitBounds se quiser (opcional)
        // this.hasFittedBounds = false;

        this.drawRouteByStatus(data.status);
        this.cdr.detectChanges();
      });

    // --- Evento de GPS (Movimento) ---
    const locationSub = this.socketService.locationUpdated$
      // Filtro relaxado: confia na sala do socket, verifica se tem location
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
    // Socorro: Não tem loja (null), tem Cliente.
    this.mapaComponent.setStaticMarkers(null as any, this.coordsCliente);
  }

  private drawRouteByStatus(status: string): void {
    if (!this.mapaComponent) return;

    // Limpa e prepara
    this.mapaComponent.clearDynamicElements();
    this.lastPlannedRouteFetch = Date.now();
    this.setStaticMarkers();

    // Desenha Entregador
    if (this.coordsEntregador) {
      this.mapaComponent.updateDriverMarker(this.coordsEntregador);
    }

    // Desenha Histórico (Rastro cinza)
    if (this.localRouteHistory.length > 0) {
      this.mapaComponent.drawHistoryPolyline(this.localRouteHistory, 'gray');
    }

    // Desenha Rota Planejada (Linha Colorida)
    this.drawPlannedRoutes(status);

    // Zoom Inteligente (Só na primeira vez ou reset forçado)
    if (!this.hasFittedBounds) {
      let boundsCoords = [this.coordsCliente];
      if (this.coordsEntregador) {
        boundsCoords.push(this.coordsEntregador);
      }
      // Se só tiver o cliente, não quebra o fitBounds
      if (boundsCoords.length > 0) {
        this.mapaComponent.fitBounds(boundsCoords);
        this.hasFittedBounds = true;
      }
    }
  }

  private drawPlannedRoutes(status: string): void {
    if (!this.mapaComponent) return;
    const currentStatus = status?.toUpperCase() || '';

    // Lógica Simplificada para Socorro:
    // Se o entregador aceitou, traça rota direta dele até o cliente.
    const activeStatuses = [
      'ACEITO',
      'A_CAMINHO',
      'EM_DESLOCAMENTO',
      'EM_ATENDIMENTO',
    ];

    if (activeStatuses.includes(currentStatus)) {
      if (this.coordsEntregador && this.coordsCliente) {
        this.fetchAndDrawPolyline(
          this.coordsEntregador,
          this.coordsCliente,
          'green' // Verde = Destino Final
        );
      }
    }
  }

  private updateDynamicRoutes(status: string): void {
    if (!this.mapaComponent || !this.coordsEntregador) return;
    const now = Date.now();

    // Throttle de 30s para rota planejada (Google API $$)
    if (now - this.lastPlannedRouteFetch > this.RECALCULATE_ROUTE_INTERVAL_MS) {
      this.drawRouteByStatus(status);
    } else {
      // Fast Update: Só move o ícone e atualiza rastro cinza
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

  onLiberarCheckIn(): void {
    if (!confirm('Confirmar a liberação manual do check-in? O status mudará para "No Local".')) {
      return;
    }
    this.socorrosService.liberarCheckInManual(this.socorro._id).subscribe({
      next: (updatedSocorro) => {
        this.snackBar.open('Check-in liberado com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.socorro = updatedSocorro;
      },
      error: (err) => {
        this.snackBar.open(
          `Erro: ${err.error?.message || 'Falha ao liberar check-in'}`,
          'Fechar',
          { duration: 5000 },
        );
      },
    });
}

  onCancelarSocorro(): void {
    if (!confirm('Tem certeza que deseja cancelar este socorro? Esta ação não pode ser desfeita.')) {
      return;
    }
    this.socorrosService.cancelarSocorro(this.socorro._id).subscribe({
      next: (updatedSocorro) => {
        this.snackBar.open('Socorro cancelado com sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.socorro = updatedSocorro;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          `Erro: ${err.error?.message || 'Falha ao cancelar socorro'}`,
          'Fechar',
          { duration: 5000 },
        );
      },
    });
}
}
