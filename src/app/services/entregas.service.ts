import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class EntregasService {
  private apiUrl = 'http://localhost:3000/entregas';

  constructor(private http: HttpClient) {}

  listarEntregas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listar`);
  }
}