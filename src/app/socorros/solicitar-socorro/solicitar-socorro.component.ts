import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocorrosService, CreateSocorroPayload } from '../../services/socorro.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-solicitar-socorro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './solicitar-socorro.component.html',
  styleUrls: ['./solicitar-socorro.component.scss']
})
export class SolicitarSocorroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private socorrosService = inject(SocorrosService);

  socorroForm!: FormGroup;
  isLoading = false;

  successMessage: string | null = null
  errorMessage: string | null = null

  ngOnInit(): void {
    this.socorroForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      serviceDescription: ['']
    });
  }

  onSubmit(): void {
    if (this.socorroForm.invalid) return;

    this.isLoading = true;
    this.successMessage = null
    this.errorMessage = null

    const formValue = this.socorroForm.value;

    const payload = {
      clientLocation: {
        address: formValue.address
      },
      serviceDescription: formValue.serviceDescription
    };

    this.socorrosService.createSocorro(payload).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.successMessage = 'Socorro solicitado com sucesso! O entregador mais próximo será notificado.';
        this.socorroForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Não foi possível solicitar o socorro.';
      }
    });
  }
}