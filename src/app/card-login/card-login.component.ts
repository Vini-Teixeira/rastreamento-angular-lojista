import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-card-login',
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './card-login.component.html',
  styleUrl: './card-login.component.scss'
})

export class CardLoginComponent {
  email = new FormControl('')
  senha = new FormControl('')
  
  showPassword: boolean = false

  formGroup: FormGroup

  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    })
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      console.log(this.formGroup.value)
    }
  }
}