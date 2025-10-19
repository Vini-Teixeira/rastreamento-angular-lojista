import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  EntregasService,
  CreateDeliveryPayload,
} from '../services/entregas.service';
import {
  GeocodingService,
  GeocodingResponse,
} from '../services/geocoding/geocoding.service';

@Component({
  selector: 'app-create-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-delivery.component.html',
  styleUrls: ['./create-delivery.component.css'],
})
export class CreateDeliveryComponent implements OnInit {
  deliveryForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isGeocoding = false;
  addressValidated = false;

  private geocodingService = inject(GeocodingService);

  constructor(
    private fb: FormBuilder,
    private entregasService: EntregasService
  ) {}

  validateAddress(): void {
    const address = this.deliveryForm.get('destinationAddress')?.value;
    if (!address || address.length < 10) {
      this.errorMessage = 'Digite um endereço mais completo para validar.';
      return;
    }

    this.isGeocoding = true;
    this.errorMessage = null;
    this.addressValidated = false;

    this.geocodingService.getCoordsFromAddress(address).subscribe({
      next: (response: GeocodingResponse) => {
        this.isGeocoding = false;
        this.addressValidated = true;

        const lng = response.coordinates[0];
        const lat = response.coordinates[1];

        this.successMessage = `Endereço validado com sucesso! Coordenadas: ${lat.toFixed(
          4
        )}, ${lng.toFixed(4)}`;
        console.log('Coordenadas recebidas', response);
      },
      error: (err) => {
        this.isGeocoding = false;
        this.addressValidated = false;
        this.errorMessage =
          err.error?.message || 'Não foi possível validar o endereço.';
      },
    });
  }

  ngOnInit(): void {
    this.deliveryForm = this.fb.group({
      destinationAddress: ['', [Validators.required, Validators.minLength(10)]],
      itemDescription: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onSubmit(): void {
    this.deliveryForm.markAllAsTouched();
    if (this.deliveryForm.invalid) return;

    if (!this.addressValidated) {
      this.errorMessage = 'Por favor, valide o endereço de destino';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload: CreateDeliveryPayload = {
      origin: {
      address: 'Avenida Doutor José da Silva Ribeiro Filho, 1476, América, Aracaju, Sergipe',
      coordinates: { lat: -10.9182428, lng: -37.0755669 }
    },
    destination: {
      address: this.deliveryForm.value.destinationAddress
    },
    itemDescription: this.deliveryForm.value.itemDescription
    };

    this.entregasService.createDelivery(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `Entrega criada com sucesso (ID: ${response._id})! Notificando o entregador mais próximo...`;
        this.deliveryForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Falha ao criar a entrega. Tente novamente.';
        console.error('Erro ao criar entrega:', err);
      },
    });
  }

  get destinationAddress() {
    return this.deliveryForm.get('destinationAddress');
  }
  get itemDescription() {
    return this.deliveryForm.get('itemDescription');
  }
}
