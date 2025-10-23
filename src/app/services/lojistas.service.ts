import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  concluidas: number;
  emAndamento: number;
  canceladas: number;
}

export interface Lojista {
  _id: string
  nomeFantasia: string
}

export interface LojistasResponse {
  data: Lojista[]
  total: number
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

  getAllLojistas(): Observable<Lojista[]> {
  const url = `${this.apiUrl}/para-selecao`;
  return this.http.get<Lojista[]>(url);
}
}