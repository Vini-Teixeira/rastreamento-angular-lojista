import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LojistasService, DashboardSummary } from '../../services/lojistas.service';
import { LegendPosition } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard-lojista',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-lojista.component.html',
  styleUrls: ['./dashboard-lojista.component.scss']
})
export class DashboardLojistaComponent implements OnInit {
  private lojistasService = inject(LojistasService);

  legendPosition = LegendPosition.Below;

  chartData: { name: string, value: number }[] = [];
  isLoading = true;
  error: string | null = null;

  colorScheme: any = {
    domain: ['#5AA454', '#FFC107', '#DC3545'] 
  };

  ngOnInit(): void {
    this.lojistasService.getDashboardSummary().subscribe({
      next: (summary: DashboardSummary) => {
        this.chartData = [
          { name: 'Concluídas', value: summary.concluidas },
          { name: 'Em Andamento', value: summary.emAndamento },
          { name: 'Canceladas', value: summary.canceladas }
        ];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar o resumo do dia.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}