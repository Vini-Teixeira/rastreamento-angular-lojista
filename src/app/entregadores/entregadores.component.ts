import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-entregadores',
  imports: [CommonModule, NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './entregadores.component.html',
  styleUrl: './entregadores.component.scss'
})

export class EntregadoresComponent {
  sidebarVisible = false
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