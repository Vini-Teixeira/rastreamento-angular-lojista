import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaEntregasComponent } from '../entregas/lista-entregas/lista-entregas.component';
import { DashboardLojistaComponent } from '../dashboard/dashboard-lojista/dashboard-lojista.component';

@Component({
  selector: 'app-painel-geral',
  standalone: true,
  imports: [
    CommonModule,
    ListaEntregasComponent,
    DashboardLojistaComponent,
  ],
  templateUrl: './painel-geral.component.html',
  styleUrls: ['./painel-geral.component.scss'],
})
export class PainelGeralComponent {

}