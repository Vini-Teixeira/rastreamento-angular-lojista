import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  concluidas: number;
  emAndamento: number;
  canceladas: number;
}

@Injectable({
  providedIn: 'root'
})
export class LojistasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/lojistas`;

  getDashboardSummary(): Observable<DashboardSummary> {
    const url = `${this.apiUrl}/me/dashboard-summary`;
    return this.http.get<DashboardSummary>(url);
  }
}