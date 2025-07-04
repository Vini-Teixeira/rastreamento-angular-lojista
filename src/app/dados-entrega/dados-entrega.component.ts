import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dados-entrega',
  templateUrl: './dados-entrega.component.html',
  styleUrls: ['./dados-entrega.component.css'],
  imports: [CommonModule]
})
export class DadosEntregaComponent {
  @Input() valorEntrega: number | null = null;
  @Input() nomeEntregador: string | null = null;
  @Input() enderecoOrigem: string | null = null;
  @Input() enderecoDestino: string | null = null;
  @Input() statusEntrega: string | null = null;
  
}