import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-registro-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro-usuario.component.html',
  styleUrl: './registro-usuario.component.scss',
})
export class RegistroUsuarioComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  registroForm: FormGroup;

  constructor() {
    this.registroForm = this.fb.group(
      {
        nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        endereco: ['', [Validators.required, Validators.minLength(10)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmarSenha: ['', [Validators.required]],
      },
      { validators: this.senhasCombinam }
    );
  }

  senhasCombinam(control: AbstractControl): ValidationErrors | null {
    const senha = control.get('password')?.value;
    const confirmarSenha = control.get('confirmarSenha')?.value;
    return senha === confirmarSenha ? null : { senhasNaoCombinam: true };
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const lojistaData = this.registroForm.value;

    this.authService
      .registerLojista(lojistaData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successMessage =
            'Registro realizado com sucesso! Redirecionando para o login...';
          setTimeout(() => {
            this.router.navigate(['/card-login']);
          }, 2000);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Ocorreu um erro no registro.';
        },
      });
  }
}
