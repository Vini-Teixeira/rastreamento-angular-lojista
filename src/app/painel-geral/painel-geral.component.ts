import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ListaEntregasComponent } from '../entregas/lista-entregas/lista-entregas.component';
import { MapaComponent } from '../mapa/mapa.component';
import { SocketService } from '../services/socket.service';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-painel-geral',
  standalone: true,
  imports: [
    CommonModule, 
    MapaComponent,
    RouterModule,
    ListaEntregasComponent,
    SidebarComponent
  ],
  templateUrl: './painel-geral.component.html',
  styleUrls: ['./painel-geral.component.scss'],
})
export class PainelGeralComponent implements OnDestroy {
  private socketService = inject(SocketService);
  private locationSub: Subscription;
  
  public entregaSelecionada: any | null = null;
  private idSalaAtual: string | null = null;

  sidebarVisible = false

  constructor() {
    this.locationSub = this.socketService.locationUpdated$.subscribe(update => {
      if (update && this.entregaSelecionada && update.deliveryId === this.entregaSelecionada._id) {
        
        const novaEntrega = { ...this.entregaSelecionada };
        novaEntrega.driverCurrentLocation = update.location;
        this.entregaSelecionada = novaEntrega;

        console.log('Painel Geral: Posição do entregador atualizada no mapa!');
      }
    });
  }

  onEntregaSelecionada(entrega: any): void {
    if (this.idSalaAtual) {
      this.socketService.leaveDeliveryRoom(this.idSalaAtual);
    }

    this.entregaSelecionada = entrega;
    if (this.entregaSelecionada?._id) {
      this.idSalaAtual = this.entregaSelecionada._id;
      this.socketService.joinDeliveryRoom(this.idSalaAtual!);
    }
  }

  ngOnDestroy(): void {
    this.locationSub?.unsubscribe();
    if (this.idSalaAtual) {
      this.socketService.leaveDeliveryRoom(this.idSalaAtual);
    }
  }
}

