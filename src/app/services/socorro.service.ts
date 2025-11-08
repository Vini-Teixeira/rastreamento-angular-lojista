import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Socorro } from '../models/socorro.model';
import { SocorroStatus } from '../core/enums/socorro-status.enum';

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

  constructor() { }

  createSocorro(payload: CreateSocorroPayload): Observable<Socorro> {
    return this.http.post<Socorro>(this.apiUrl, payload);
  }
}