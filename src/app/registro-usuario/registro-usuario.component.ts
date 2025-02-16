import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro-usuario',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registro-usuario.component.html',
  styleUrl: './registro-usuario.component.scss'
})
export class RegistroUsuarioComponent {
  registroForm: FormGroup
  forcaSenha: string = ''

  constructor(private fb: FormBuilder) {

    this.registroForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      telefone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      endereco: ['', [Validators.required]],
      cpfCnpj: ['', [Validators.required, Validators.pattern(/^\d{11,14}$/)]],
    }, { validator: this.senhasCombinam })

    this.registroForm.get('senha')?.valueChanges.subscribe((senha) => {
      this.forcaSenha = this.verificarForcaSenha(senha)
    })
  }

  verificarForcaSenha(senha: string) {
    const comprimento = senha.length;
    const temNumeros = /\d/.test(senha);
    const temMaiusculas = /[A-Z]/.test(senha);
    const temMinusculas = /[a-z]/.test(senha);
    const temEspeciais = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  
    let forca = 0;
  
    if (comprimento >= 8) forca++;
    if (temNumeros) forca++;
    if (temMaiusculas) forca++;
    if (temMinusculas) forca++;
    if (temEspeciais) forca++;
    
    if (forca <= 2) return 'Fraca';
    if (forca <= 4) return 'Média';
    return 'Forte';
  }

  senhasCombinam(formGroup: FormGroup) {
    const senha = formGroup.get('senha')?.value
    const confirmarSenha = formGroup.get('confirmarSenha')?.value
    return senha === confirmarSenha ? null : { senhasNaoCombinam: true }
  }

  onSubmit() {
    if (this.registroForm.valid) {
      console.log('Formulário enviado', this.registroForm.value)
    } else {
      console.log('Formulário enviado')
    }
  }
}