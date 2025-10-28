import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GeocodingResponse {
  type: 'Point';
  coordinates: [number, number]; 
}
export interface DirectionsResponse {
  polyline: string;
}
export interface LatLng {
  lat: number;
  lng: number;
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

  getDirections(
    origin: LatLng,
    destination: LatLng
  ): Observable<DirectionsResponse> {
    const params = new HttpParams()
      .set('origin', `${origin.lat},${origin.lng}`)
      .set('destination', `${destination.lat},${destination.lng}`);

    return this.http.get<DirectionsResponse>(`${this.apiUrl}/directions`, {
      params,
    });
  }
}