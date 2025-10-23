import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LojistasService, DashboardSummary } from '../../services/lojistas.service';
import { SocketService } from '../../services/socket.service'; 
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-lojista',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-lojista.component.html',
  styleUrls: ['./dashboard-lojista.component.scss']
})
export class DashboardLojistaComponent implements OnInit, OnDestroy {
  private lojistasService = inject(LojistasService);
  private socketService = inject(SocketService);

  legendPosition = LegendPosition.Below;
  chartData: { name: string, value: number }[] = [];
  isLoading = true;
  error: string | null = null;
  colorScheme: any = {
    domain: ['#28A745', '#FFC107', '#DC3545']
  };

  private updateSubscription!: Subscription;

  ngOnInit(): void {
    this.fetchDashboardData();
    this._listenForUpdates();
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  private fetchDashboardData(): void {
    this.isLoading = true;
    this.lojistasService.getDashboardSummary().subscribe({
      next: (summary: DashboardSummary) => {
        this.chartData = [
          { name: 'Concluídas', value: summary.concluidas },
          { name: 'Em Andamento', value: summary.emAndamento },
          { name: 'Canceladas', value: summary.canceladas }
        ];
        this.isLoading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar o resumo do dia.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  private _listenForUpdates(): void {
    this.updateSubscription = this.socketService.deliveryUpdated$.subscribe(
      () => {
        console.log('Dashboard: Atualização recebida via WebSocket! A buscar novos dados...');
        this.fetchDashboardData();
      }
    );
  }
}