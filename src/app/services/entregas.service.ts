import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Delivery {
  _id: string
  status: string
  itemDescription: string
  codigoEntrega?: string
  checkInLiberadoManualmente?: boolean
  origin: { address: string }
  destination: { address: string }
}

export interface CreateDeliveryPayload {
  origin?: {
    address: string;
    coordinates: { lat: number; lng: number; };
  };
  destination: { address: string; };
  itemDescription: string;
  origemId?: string;
}

export interface ApiResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class EntregasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/entregas`;

  constructor() {}

  createDelivery(payload: CreateDeliveryPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  listarEntregas(): Observable<Delivery[]> {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return this.http.get<ApiResponse>(this.apiUrl, { headers }).pipe(
      map(response => response.deliveries || [])
    );
  }
  liberarCheckInManual(deliveryId: string): Observable<any>{
    const url = `${this.apiUrl}/${deliveryId}/liberar-checkin`
    return this.http.patch(url, {})
  }
}

