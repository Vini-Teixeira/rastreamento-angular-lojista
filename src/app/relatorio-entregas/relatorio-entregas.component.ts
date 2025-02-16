import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-relatorio-entregas',
  imports: [CommonModule, NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './relatorio-entregas.component.html',
  styleUrl: './relatorio-entregas.component.scss'
})
export class RelatorioEntregasComponent {
  sidebarVisible = false;
  isLoading = false

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  }

  buscar() {
    this.isLoading = true
    setTimeout(() => {
      this.isLoading = false
    }, 3000)
  }
}