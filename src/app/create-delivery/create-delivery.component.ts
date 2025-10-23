import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  EntregasService,
  CreateDeliveryPayload,
} from '../services/entregas.service';
import { GeocodingService } from '../services/geocoding/geocoding.service';
import { LojistasService, Lojista } from '../services/lojistas.service';

@Component({
  selector: 'app-create-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-delivery.component.html',
  styleUrls: ['./create-delivery.component.scss'],
})
export class CreateDeliveryComponent implements OnInit {
  deliveryForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  lojas$!: Observable<Lojista[]>;

  private fb = inject(FormBuilder);
  private entregasService = inject(EntregasService);
  private lojistasService = inject(LojistasService); 

  ngOnInit(): void {
    this.lojas$ = this.lojistasService.getAllLojistas();

    this.deliveryForm = this.fb.group({
      deliveryType: ['propria', Validators.required],
      origemId: [null],
      destinationAddress: ['', [Validators.required, Validators.minLength(10)]],
      itemDescription: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    if (this.deliveryForm.invalid || this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.deliveryForm.value;

    const payload: CreateDeliveryPayload = {
      destination: { address: formValue.destinationAddress },
      itemDescription: formValue.itemDescription,
    };

    if (formValue.deliveryType === 'parceira' && formValue.origemId) {
      payload.origemId = formValue.origemId;
    }

    this.entregasService.createDelivery(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `Entrega criada com sucesso! A notificar o entregador...`;
        this.deliveryForm.reset({ deliveryType: 'propria' }); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Falha ao criar a entrega.';
      },
    });
  }
}
