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
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EntregasService, Delivery } from '../../services/entregas.service';
import { SocketService } from '../../services/socket.service';
import { DeliveryDetailsModalComponent } from '../delivery-details-modal/delivery-details-modal.component';
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';
import { AssignManualModalComponent } from '../../modals/assign-manual-modal/assign-manual-modal.component';

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
    FormatStatusPipe,
   // AssignManualModalComponent,
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
    'driverName',
    'actions',
  ];
  dataSource = new MatTableDataSource<Delivery>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  error: string | null = null;

  private toastr = inject(ToastrService);
  private deliveryUpdateSubscription!: Subscription;
  private entregasService = inject(EntregasService);
  private socketService = inject(SocketService);

  public dialog = inject(MatDialog);

  ngOnInit(): void {
    this.carregarDadosIniciais();
    this.ouvirAtualizacoes();
  }

  ngOnDestroy(): void {
    this.deliveryUpdateSubscription?.unsubscribe();
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
        if (!updatedDelivery || !updatedDelivery.payload) return;
        console.log(
          `[ListaEntregas] Evento 'deliveryUpdated$' recebido! Status: ${updatedDelivery.payload.status}`,
          updatedDelivery.payload
        );

        const currentData = this.dataSource.data;
        const payload = updatedDelivery.payload as Delivery;

        const index = currentData.findIndex((d) => d._id === payload._id);

        if (index > -1) {
          currentData[index] = payload;
        } else {
          currentData.unshift(payload);
        }
        this.dataSource.data = [...currentData];
      });
  }

  abrirModalAtribuicao(entrega: Delivery): void {
    const dialogRef = this.dialog.open(AssignManualModalComponent, {
      width: '450px',
      data: { entrega: entrega },
    });
    dialogRef.afterClosed().subscribe((success) => {
      if (success === true) {
        this.toastr.success('Entrega atribuída e motorista notificado!');
      }
    });
  }
}
