import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Socorro } from '../models/socorro.model';

export interface SocorroApiResponse {
  data: Socorro[]
  total: number
  page: number
  limit: number
}

export interface CreateSocorroPayload {
  clientLocation: {
    address: string;
    coordinates?: {lat: number, lng: number}
  };
  serviceDescription?: string;
  clienteNome: string;
  clienteTelefone: string;
  placaVeiculo?: string;
  modeloVeiculo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocorrosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/socorros`;

  private getNoCacheHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
  }

  constructor() { }

  createSocorro(payload: CreateSocorroPayload): Observable<Socorro> {
    return this.http.post<Socorro>(this.apiUrl, payload);
  }

  listarSocorros(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Observable<SocorroApiResponse> {
    const headers = this.getNoCacheHeaders()
    let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString()) 
    if(status) {
      params = params.set('status', status)
    }
    return this.http.get<SocorroApiResponse>(this.apiUrl, { headers, params })
  }
}