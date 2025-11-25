import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { EntregasService, Delivery } from '../../services/entregas.service';
import { SocorrosService } from '../../services/socorro.service';
import { Socorro } from '../../models/socorro.model';
import {
  EntregadoresService,
  Entregador,
} from '../../services/entregadores.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assign-manual-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './assign-manual-modal.component.html',
  styleUrls: ['./assign-manual-modal.component.scss'],
})
export class AssignManualModalComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<AssignManualModalComponent>);
  public data: { entrega?: Delivery; socorro?: Socorro } = inject(MAT_DIALOG_DATA);
  private entregadoresService = inject(EntregadoresService);
  private entregasService = inject(EntregasService);
  private socorrosService = inject(SocorrosService)
  private toastr = inject(ToastrService);

  // Estado da UI
  public isLoadingDrivers = true;
  public isSubmitting = false;
  public error: string | null = null;

  // Dados
  public availableDrivers: Entregador[] = [];
  public selectedDriverId: string[] = [];

  ngOnInit(): void {
    this.loadAvailableDrivers();
  }

  loadAvailableDrivers(): void {
    this.isLoadingDrivers = true;
    this.error = null;

    this.entregadoresService.getAvailableDrivers().subscribe({
      next: (drivers) => {
        if (drivers.length === 0) {
          this.error = 'Nenhum entregador disponível encontrado.';
        }
        this.availableDrivers = drivers;
        this.isLoadingDrivers = false;
      },
      error: (err) => {
        this.error = 'Falha ao buscar entregadores.';
        this.isLoadingDrivers = false;
      },
    });
  }

  onAssign(): void {
    if (!this.selectedDriverId || this.selectedDriverId.length === 0 || this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    const driverIdToSend = this.selectedDriverId[0];

    if (this.data.entrega) {
      this.entregasService
        .assignManual(this.data.entrega._id, driverIdToSend)
        .subscribe({
           next: () => this.handleSuccess(),
           error: (err) => this.handleError(err)
        });
    } else if (this.data.socorro) {
      this.socorrosService
        .assignManual(this.data.socorro._id, driverIdToSend)
        .subscribe({
           next: () => this.handleSuccess(),
           error: (err) => this.handleError(err)
        });
    }
  }

  private handleSuccess() {
    this.toastr.success('Entregador atribuído com sucesso')
    this.dialogRef.close(true)
  }

  private handleError(err: any) {
    this.error = err.error?.message || 'Falha ao atribuir Entregador'
    this.isSubmitting= false
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
