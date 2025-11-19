import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Socorro } from '../../models/socorro.model';

@Component({
  selector: 'app-socorro-details-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './socorro-details-modal.component.html',
})
export class SocorroDetailsModalComponent {
  public dialogRef = inject(MatDialogRef<SocorroDetailsModalComponent>);
  public socorro: Socorro = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}