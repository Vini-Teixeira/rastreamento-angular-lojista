import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core'; // 1. Importar inject
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs'; // 2. Importar Observable
import { EntregasService } from '../services/entregas.service';
import { MapaComponent } from '../mapa/mapa.component';
import { DadosEntregaComponent } from '../dados-entrega/dados-entrega.component';
import { MapLoaderService } from '../services/map-loader.service'; // 3. Importar o novo serviço

interface DetalhesEntrega {
  valor?: number | null;
  entregador?: { nome?: string | null } | null;
  origem?: { endereco?: string | null } | null;
  destino?: { endereco?: string | null } | null;
  status?: string | null;
}

@Component({
  selector: 'app-painel-geral',
  standalone: true, // Garante que o componente seja standalone
  imports: [
    CommonModule,
    NgOptimizedImage,
    RouterLink,
    MapaComponent,
    DadosEntregaComponent,
  ],
  templateUrl: './painel-geral.component.html',
  styleUrl: './painel-geral.component.scss',
})
export class PainelGeralComponent implements OnInit {
  // Injeção de dependências moderna
  public entregasService = inject(EntregasService);
  private mapLoaderService = inject(MapLoaderService); // 4. Injetar o MapLoaderService

  // 5. Criar um Observable para controlar a visibilidade do mapa
  public isApiLoaded$: Observable<boolean>;

  sidebarVisible = false;
  entregas: any[] = [];
  detalhesEntrega: DetalhesEntrega | null = null;

  constructor() {
    // 6. Atribuir o Observable do serviço à nossa propriedade local
    this.isApiLoaded$ = this.mapLoaderService.apiLoaded$;
  }

  ngOnInit(): void {
    // A lógica para buscar entregas permanece a mesma.
    // O HttpInterceptor cuidará da autenticação automaticamente.
    this.entregasService.listarEntregas().subscribe((data) => {
      this.entregas = data;
    });
  }

  buscarDetalhesEntrega(idEntrega: string): void {
    this.entregasService.obterDetalhesEntregaEspecifica(idEntrega).subscribe({
      next: (data) => {
        this.detalhesEntrega = {
          valor: data?.valor,
          entregador: data?.entregador,
          origem: data?.origem,
          destino: data?.destino,
          status: data?.status,
        };
      },
      error: (error) => {
        console.error('Erro ao buscar detalhes da entrega:', error);
        this.detalhesEntrega = null;
      },
    });
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
