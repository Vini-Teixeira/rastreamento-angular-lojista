import { Component, OnInit, inject, NgZone, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  SocorrosService,
  CreateSocorroPayload,
} from '../../services/socorro.service';
import {
  finalize,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  tap,
} from 'rxjs';

declare const google: any;

@Component({
  selector: 'app-solicitar-socorro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
  ],
  templateUrl: './solicitar-socorro.component.html',
  styleUrls: ['./solicitar-socorro.component.scss'],
})
export class SolicitarSocorroComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private socorrosService = inject(SocorrosService);
  private ngZone = inject(NgZone);
  private subs = new Subscription();

  socorroForm!: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  private autocompleteService: any;
  private placesService: any;
  private mapEl = document.createElement('div');

  private isSelectingSuggestion = false;

  ngOnInit(): void {
    this.socorroForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(5)]],
      destinationCoords: [null],
      clienteNome: ['', [Validators.required, Validators.minLength(2)]],
      clienteTelefone: ['', [Validators.required, Validators.minLength(10)]],
      placaVeiculo: [''],
      modeloVeiculo: [''],
      serviceDescription: [''],
    });{
      validators: [this.addressOrCoordsValidator()]
    }
    this.setupAddressAutocomplete();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setupAddressAutocomplete(): void {
    const sub = this.socorroForm
      .get('address')
      ?.valueChanges.pipe(
        debounceTime(700),
        distinctUntilChanged(),
        tap((value) => {
          if (
            !this.isSelectingSuggestion &&
            this.socorroForm.get('destinationCoords')?.value
          ) {
            this.socorroForm.patchValue({ destinationCoords: null });
          }
          this.isSelectingSuggestion = false;
          this.getAutocompleteSuggestions(value);
        })
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
    if (!this.autocompleteService) return;

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
    this.isSelectingSuggestion = true;
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
            this.socorroForm.patchValue(
              {
                address: place.formatted_address,
              },
              { 
                emitEvent: false,
              }
            );

            const coords = {
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng(),
            };
            this.socorroForm.patchValue({ destinationCoords: coords });
            this.isSelectingSuggestion = false
          }
        });
      }
    );
  }
  // --- FIM DA LÓGICA DO AUTOCOMPLETE ---

  onSubmit(): void {
    if (this.socorroForm.invalid) {
      this.socorroForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;
    const formValue = this.socorroForm.value;
    const payload: CreateSocorroPayload = {
      clientLocation: {
        address: formValue.address,
        coordinates: formValue.destinationCoords,
      },
      clienteNome: formValue.clienteNome,
      clienteTelefone: formValue.clienteTelefone,
      placaVeiculo: formValue.placaVeiculo || undefined,
      modeloVeiculo: formValue.modeloVeiculo || undefined,
      serviceDescription: formValue.serviceDescription || undefined,
    };

    this.socorrosService
      .createSocorro(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.successMessage =
            'Socorro solicitado com sucesso! O entregador mais próximo será notificado.';
          this.socorroForm.reset();
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Não foi possível solicitar o socorro.';
        },
      });
  }

  private addressOrCoordsValidator() {
  return (formGroup: FormGroup) => {
    const address = formGroup.get('address')?.value;
    const coords = formGroup.get('destinationCoords')?.value;
    if (coords && coords.lat && coords.lng) {
      return null;
    }
    if (address && address.length >= 8) {
      return null;
    }
    return { addressInvalid: true };
  };
}

}
