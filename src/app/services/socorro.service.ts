import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateSocorroPayload {
  clientLocation: {
    address: string;
  };
  serviceDescription?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocorrosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/socorros`;

  constructor() { }

  createSocorro(payload: CreateSocorroPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}