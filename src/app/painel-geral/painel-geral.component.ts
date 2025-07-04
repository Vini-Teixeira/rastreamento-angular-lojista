import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component , OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EntregasService } from '../services/entregas.service';
import { MapaComponent } from "../mapa/mapa.component";
import { DadosEntregaComponent } from '../dados-entrega/dados-entrega.component';

interface DetalhesEntrega {
  valor?: number | null;
  entregador?: { nome?: string | null } | null;
  origem?: { endereco?: string | null } | null;
  destino?: { endereco?: string | null } | null;
  status?: string | null;
}

@Component({
  selector: 'app-painel-geral',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, CommonModule, MapaComponent, DadosEntregaComponent],
  templateUrl: './painel-geral.component.html',
  styleUrl: './painel-geral.component.scss'
})

export class PainelGeralComponent implements OnInit {
  detalhesEntrega: DetalhesEntrega | null = null

  constructor(public entregasService: EntregasService) {}

  sidebarVisible = false;
  entregas: any[] = [];

  buscarDetalhesEntrega(idEntrega: string): void {
    this.entregasService.obterDetalhesEntregaEspecifica(idEntrega).subscribe( 
      (data) => {
        this.detalhesEntrega = {
          valor: data?.valor !== undefined ? data.valor : null,
          entregador: data?.entregador ? { nome: data.entregador.nome !== undefined ? data.entregador.nome : null } : null,
          origem: data?.origem ? { endereco: data.origem.endereco !== undefined ? data.origem.endereco : null } : null,
          destino: data?.destino ? { endereco: data.destino.endereco !== undefined ? data.destino.endereco : null } : null,
          status: data?.status !== undefined ? data.status : null,
        };
      },
      (error) => {
        console.error('Erro ao buscar detalhes da entrega:', error);
        this.detalhesEntrega = null;
      }
    );
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  ngOnInit(): void {
    this.entregasService.listarEntregas().subscribe(data => {
      this.entregas = data;
    });
  }
}