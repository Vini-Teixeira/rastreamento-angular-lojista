import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaEntregasComponent } from '../entregas/lista-entregas/lista-entregas.component';
import { ListaSocorrosComponent } from '../socorros/lista-socorros/lista-socorros.component';
import { DashboardLojistaComponent } from '../dashboard/dashboard-lojista/dashboard-lojista.component';
import { SocketService } from '../services/socket.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-painel-geral',
  standalone: true,
  imports: [
    CommonModule,
    ListaEntregasComponent,
    ListaSocorrosComponent,
    DashboardLojistaComponent,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './painel-geral.component.html',
  styleUrls: ['./painel-geral.component.scss'],
})
export class PainelGeralComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}