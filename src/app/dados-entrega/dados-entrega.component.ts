import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Delivery, EntregasService } from '../services/entregas.service';

@Component({
  selector: 'app-dados-entrega',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './dados-entrega.component.html',
  styleUrls: ['./dados-entrega.component.scss'],
})
export class DadosEntregaComponent {
  private entregasService = inject(EntregasService)
  private snackBar = inject(MatSnackBar)

  constructor(
    public dialogRef: MatDialogRef<DadosEntregaComponent>,  
    @Inject(MAT_DIALOG_DATA) public entrega: Delivery) {}

    onLiberarCheckIn(): void {
      this.entregasService.liberarCheckInManual(this.entrega._id).subscribe({
        next: (updateDelivery) => {
          this.snackBar.open('Check-in liberado com sucesso!', 'Fechar', {duration: 3000})
          this.dialogRef.close(updateDelivery)  
        },
        error: (err) => {
          console.error('Erro ao liberar o Check-In', err)
          this.snackBar.open(`Erro: ${err.error.message || 'Falha ao liberar Check-In'}`, 'Fechar', {duration: 5000})
        }
      })
    }
}
