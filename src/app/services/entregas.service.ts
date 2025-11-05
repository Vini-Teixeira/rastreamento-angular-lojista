import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeliveryStatus } from '../core/enums/delivery-status.enum'; 

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
  timestamp?: string;
}

export interface DeliveryLocation {
  address: string;
  coordinates: GeoJsonPoint; 
}

export interface Delivery {
  _id: string;
  status: DeliveryStatus; 
  itemDescription: string;
  codigoEntrega?: string;
  checkInLiberadoManualmente?: boolean;
  origin: DeliveryLocation; 
  destination: DeliveryLocation; 
  driverCurrentLocation?: GeoJsonPoint; 
  routeHistory?: GeoJsonPoint[];
  driverId?: { _id: string, nome: string } | string; 
}

export interface CreateDeliveryPayload {
  origin?: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  destination: { address: string;
    coordinates: {lat: number, lng: number}
   };
  itemDescription: string;
  origemId?: string;
  recolherSucata?: boolean;
  tipoEntrega: 'propria' | 'parceira'
  tipoDocumento?: 'NF' | 'CUPOM FISCAL'
  numeroDocumento?: string
}

export interface ApiResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
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
      Pragma: 'no-cache',
      Expires: '0',
    });

    return this.http.get<ApiResponse>(this.apiUrl, { headers }).pipe(
      map(response => response.deliveries || [])
    );
  }

  liberarCheckInManual(deliveryId: string): Observable<Delivery> {
    const url = `${this.apiUrl}/${deliveryId}/liberar-checkin`;
    return this.http.patch<Delivery>(url, {});
  }

  cancelarEntrega(deliveryId: string): Observable<Delivery> {
    const url = `${this.apiUrl}/${deliveryId}/cancelar`;
    return this.http.patch<Delivery>(url, {});
  }

  getDirections(deliveryId: string): Observable<{ polyline: string }> {
    const url = `${this.apiUrl}/${deliveryId}/directions`;
    return this.http.get<{ polyline: string }>(url);
  }
}