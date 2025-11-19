import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';
import { Socorro } from '../../models/socorro.model';
import { SocorrosService, SocorroApiResponse } from '../../services/socorro.service';
import { SocorroDetailsModalComponent } from '../socorro-details-modal/socorro-details-modal.component';

@Component({
  selector: 'app-lista-socorros',
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
    FormatStatusPipe,
    SocorroDetailsModalComponent,
  ],
  templateUrl: './lista-socorros.component.html',
  styleUrls: ['./lista-socorros.component.scss'],
})
export class ListaSocorrosComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'status',
    'clienteNome',
    'clientLocation',
    'driverName',
    'actions'
  ]
  dataSource = new MatTableDataSource<Socorro>()
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true
  error: string | null = null
  totalData = 0

  private socketSubscription!: Subscription;
  private socorrosService = inject(SocorrosService)
  private socketService = inject(SocketService)
  public dialog = inject(MatDialog)

  ngOnInit(): void {
    this.carregarDadosIniciais();
    this.ouvirAtualizacoes();

    this.dataSource.sortingDataAccessor = (item: Socorro, prop: string) => {
      switch(prop) {
        case 'clientLocation':
          return item.clientLocation.address
        case 'driverName':
  return item.driverId && typeof item.driverId === 'object'
    ? (item.driverId as { nome?: string }).nome ?? ''
    : '';
        default: 
          return (item as any)[prop]
      }
    }
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe()
  }

  abrirModalDetalhes(socorro: Socorro): void {
    const dialogRef = this.dialog.open(SocorroDetailsModalComponent, {
      width: '80vw',
      height: '90vh',
      maxWidth: '1200px',
      data: socorro
    })
    dialogRef.afterClosed().subscribe((result) => {
      if(result === true) {
        this.carregarDadosIniciais()
      }
    })
  }
  carregarDadosIniciais(): void {
    this.isLoading = true
    this.error = null

    this.socorrosService.listarSocorros(1, 100).subscribe({
      next: (response: SocorroApiResponse) => {
        this.dataSource.data = response.data
        this.totalData = response.total
        this.dataSource.paginator = this.paginator
        this.dataSource.sort = this.sort
        this.isLoading = false
      },
      error: (err) => {
        console.log('Erro ao carregar socorros', err)
        this.error = 'Não foi possível carregar os socorros'
        this.isLoading = false
      }
    })
  }
  
  ouvirAtualizacoes(): void {
    this.socketSubscription = 
      this.socketService.socorroUpdated$.subscribe((updatedJob) => {
        if(!updatedJob || !updatedJob.payload) return 
        if(!updatedJob.payload.codigoSocorro) {
          return
        }
        const currentData = this.dataSource.data
        const index = currentData.findIndex(
          (d) => d._id === updatedJob.deliveryId
        )
        const payload= updatedJob.payload as Socorro
        if(index > -1) {
          currentData[index] = { ...currentData[index], ...payload }
        } else {
          currentData.unshift(payload)
        }
        this.dataSource.data = [...currentData]
      })
  }

}