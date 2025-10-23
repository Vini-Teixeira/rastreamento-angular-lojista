import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-painel-layout',
  imports: [HeaderComponent, RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './painel-layout.component.html',
  styleUrl: './painel-layout.component.scss',
})
export class PainelLayoutComponent {
  public isSidebarCollapsed = false
  onSidebarToggle(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed
  }
}
