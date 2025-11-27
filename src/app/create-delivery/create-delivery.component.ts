import { Component, OnInit, inject, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  EntregasService,
  CreateDeliveryPayload,
} from '../services/entregas.service';
import { LojistasService, Lojista } from '../services/lojistas.service';
import { EModoPagamento } from '../core/enums/pagamento.enum';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from '../services/socket.service';
//import { GeocodingService } from '../services/geocoding/geocoding.service';

declare const google: any;

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
    MatCheckboxModule,
    MatAutocompleteModule,
  ],
  templateUrl: './create-delivery.component.html',
  styleUrls: ['./create-delivery.component.scss'],
})
export class CreateDeliveryComponent implements OnInit, OnDestroy {
  deliveryForm!: FormGroup;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  lojas$!: Observable<Lojista[]>;
  private subs = new Subscription();

  private fb = inject(FormBuilder);
  private entregasService = inject(EntregasService);
  private lojistasService = inject(LojistasService);
  private ngZone = inject(NgZone);
  private toastr = inject(ToastrService);
  private socketService = inject(SocketService);
  //private geocodingService = inject(GeocodingService);

  public pagamentoOptions = [
    { value: EModoPagamento.PIX, viewValue: 'PIX' },
    { value: EModoPagamento.DINHEIRO, viewValue: 'Dinheiro' },
    {
      value: EModoPagamento.CARTAO_MAQUININHA,
      viewValue: 'Cartão (Maquininha)',
    },
  ];

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  private autocompleteService: any;
  private placesService: any;
  private mapEl = document.createElement('div');

  ngOnInit(): void {
    this.deliveryForm = this.fb.group({
      deliveryType: ['propria', Validators.required],
      origemId: [null],
      destinationAddress: ['', Validators.required],
      destinationCoords: [null, Validators.required],
      itemDescription: ['', [Validators.required, Validators.minLength(3)]],
      clienteNome: ['', Validators.required],
      clienteTelefone: ['', [Validators.required]],
      modalidadePagamento: [null, Validators.required],
      observacoes: [''],
      recolherSucata: [false],
      tipoDocumento: [null],
      numeroDocumento: [''],
    });

    this.setupConditionalValidation();
    this.lojas$ = this.lojistasService.getAllLojistas();
    this.setupAddressAutocomplete();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setupAddressAutocomplete(): void {
    const sub = this.deliveryForm
      .get('destinationAddress')
      ?.valueChanges.pipe(
        debounceTime(700),
        distinctUntilChanged(),
        tap((value) => this.getAutocompleteSuggestions(value))
      )
      .subscribe();
    if (sub) this.subs.add(sub);
  }

  private getAutocompleteSuggestions(value: string | null): void {
    if (!value || value.length < 3) {
      this.suggestions = [];
      return;
    }
    if (!this.autocompleteService && window.google) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
    }

    if (!this.autocompleteService) {
      console.warn('AutocompleteService ainda não está pronto.');
      return;
    }

    this.autocompleteService.getPlacePredictions(
      {
        input: value,
        types: ['address'],
        componentRestrictions: { country: 'br' },
      },
      (
        predictions: google.maps.places.AutocompletePrediction[] | null,
        status: any
      ) => {
        this.ngZone.run(() => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            this.suggestions = predictions;
          } else {
            this.suggestions = [];
          }
        });
      }
    );
  }

  selectSuggestion(
    suggestion: google.maps.places.AutocompletePrediction
  ): void {
    if (!suggestion.place_id) return;

    this.suggestions = [];
    if (!this.placesService && window.google) {
      this.placesService = new google.maps.places.PlacesService(this.mapEl);
    }

    if (!this.placesService) return;

    this.placesService.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['formatted_address', 'geometry.location'],
      },
      (place: any, status: any) => {
        this.ngZone.run(() => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            this.deliveryForm.patchValue({
              destinationAddress: place.formatted_address,
            });

            const coords = {
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng(),
            };
            this.deliveryForm.patchValue({ destinationCoords: coords });
          }
        });
      }
    );
  }

  setupConditionalValidation(): void {
    const tipoDocControl = this.deliveryForm.get('tipoDocumento');
    const numDocControl = this.deliveryForm.get('numeroDocumento');

    const sub = this.deliveryForm
      .get('deliveryType')
      ?.valueChanges.subscribe((type) => {
        if (type === 'propria') {
          tipoDocControl?.setValidators(Validators.required);
          numDocControl?.setValidators(Validators.required);
        } else {
          tipoDocControl?.clearValidators();
          numDocControl?.clearValidators();
          tipoDocControl?.setValue(null);
          numDocControl?.setValue('');
        }
        tipoDocControl?.updateValueAndValidity();
        numDocControl?.updateValueAndValidity();
      });

    if (sub) this.subs.add(sub);
  }

  onSubmit(): void {
    if (this.deliveryForm.invalid || this.isLoading) {
      this.deliveryForm.markAllAsTouched();
      if (this.deliveryForm.get('destinationCoords')?.invalid) {
        this.errorMessage =
          'Por favor, selecione um endereço válido da lista de sugestões.';
      }
      return;
    }
    if (!this.deliveryForm.get('destinationCoords')?.value) {
      this.errorMessage =
        'Por favor, selecione um endereço válido da lista de sugestões.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    const formValue = this.deliveryForm.value;
    const cleanTelefone = (formValue.clienteTelefone || '').replace(/\D/g, '');
    const payload: CreateDeliveryPayload = {
      destination: {
        address: formValue.destinationAddress,
        coordinates: formValue.destinationCoords,
      },
      itemDescription: formValue.itemDescription,
      clienteNome: formValue.clienteNome,
      clienteTelefone: cleanTelefone,
      modalidadePagamento: formValue.modalidadePagamento,
      observacoes: formValue.observacoes,
      recolherSucata: formValue.recolherSucata,
      tipoEntrega: formValue.deliveryType,
      tipoDocumento: formValue.tipoDocumento,
      numeroDocumento: formValue.numeroDocumento,
    };

    if (formValue.deliveryType === 'parceira' && formValue.origemId) {
      payload.origemId = formValue.origemId;
    }
    console.log(payload);
    this.entregasService.createDelivery(payload).subscribe({
      next: (novaEntrega) => {
        this.isLoading = false;
        this.socketService.addLocalNotification(
          'SUCCESS',
          'Entrega Criada',
          `Entrega #${novaEntrega.codigoEntrega} criada e enviada ao motorista.`,
          novaEntrega
        );
        const currentDeliveryType = 
        this.deliveryForm.get('deliveryType')?.value || 'propria';
        this.deliveryForm.reset({ deliveryType: currentDeliveryType })
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error(err.error?.message || 'Falha ao criar a entrega.', 'Erro');
      },
    });
  }
}
