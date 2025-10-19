import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GeocodingResponse {
  type: 'Point';
  coordinates: [number, number];
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCoordsFromAddress(address: string): Observable<GeocodingResponse> {
    const params = { address };
    return this.http.get<GeocodingResponse>(`${this.apiUrl}/geocoding`, {
      params,
    });
  }
}
