import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocorrosService } from '../../services/socorro.service';

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

  ngOnInit(): void {
    this.socorroForm = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      serviceDescription: ['']
    });
  }

  onSubmit(): void {
    if (this.socorroForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const formValue = this.socorroForm.value;

    const payload = {
      clientLocation: {
        address: formValue.address
      },
      serviceDescription: formValue.serviceDescription
    };

    this.socorrosService.createSocorro(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Socorro solicitado com sucesso!', response);
        alert('Socorro solicitado com sucesso!');
        this.socorroForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro ao solicitar socorro', err);
        alert(`Erro: ${err.error.message || 'Não foi possível solicitar o socorro.'}`);
      }
    });
  }
}