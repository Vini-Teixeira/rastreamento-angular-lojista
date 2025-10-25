import { Component, Inject, inject } from '@angular/core';
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
import { FormatStatusPipe } from '../../shared/pipes/format-status.pipe';

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
    FormatStatusPipe,
  ],
  templateUrl: './delivery-details-modal.component.html',
  styleUrls: ['./delivery-details-modal.component.scss'],
})
export class DeliveryDetailsModalComponent {
  private entregasService = inject(EntregasService);
  private snackBar = inject(MatSnackBar);
  public DeliveryStatus = DeliveryStatus;

  constructor(
    public dialogRef: MatDialogRef<DeliveryDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public entrega: Delivery
  ) {}

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
