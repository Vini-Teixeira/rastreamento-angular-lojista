import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { PainelEstadoService } from '../../services/painel-estado.service';
import { EntregasService, Delivery } from '../../services/entregas.service';
import { SocketService } from '../../services/socket.service';
import { DeliveryDetailsModalComponent } from '../delivery-details-modal/delivery-details-modal.component';
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';

@Component({
  selector: 'app-lista-entregas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    FormatStatusPipe
  ],
  templateUrl: './lista-entregas.component.html',
  styleUrls: ['./lista-entregas.component.scss'],
})
export class ListaEntregasComponent implements OnInit, OnDestroy {
  @Output() entregaSelecionadaParaMapa = new EventEmitter<any>();

  displayedColumns: string[] = [
    'status',
    'itemDescription',
    'destination',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  error: string | null = null;

  private deliveryUpdateSubscription!: Subscription;

  private painelEstadoService = inject(PainelEstadoService);
  private entregasService = inject(EntregasService);
  private socketService = inject(SocketService);
  public dialog = inject(MatDialog);

  ngOnInit(): void {
    this.carregarDadosIniciais();
    this.ouvirAtualizacoes();
  }

  ngOnDestroy(): void {
    this.deliveryUpdateSubscription?.unsubscribe();
    this.socketService.disconnect();
  }

  abrirModalDetalhes(entrega: Delivery): void {
    const dialogRef = this.dialog.open(DeliveryDetailsModalComponent, {
      width: '80vw',
      height: '90vh',
      maxWidth: '1200px',
      data: entrega,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.carregarDadosIniciais();
      }
    });
  }

  carregarDadosIniciais(): void {
    this.isLoading = true;
    this.error = null;
    this.entregasService.listarEntregas().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this.socketService.connect();
      },
      error: (err) => {
        console.error('Erro ao carregar entregas', err);
        this.error = 'Não foi possível carregar as entregas.';
        this.isLoading = false;
      },
    });
  }

  ouvirAtualizacoes(): void {
    this.deliveryUpdateSubscription =
      this.socketService.deliveryUpdated$.subscribe((updatedDelivery) => {
        if (!updatedDelivery) return;

        const currentData = this.dataSource.data;
        const index = currentData.findIndex(
          (d) => d._id === updatedDelivery.deliveryId
        );

        if (index > -1) {
          currentData[index] = {
            ...currentData[index],
            ...updatedDelivery.payload,
          };
        } else {
          currentData.unshift(updatedDelivery.payload);
        }
        this.dataSource.data = [...currentData];
      });
  }
}
