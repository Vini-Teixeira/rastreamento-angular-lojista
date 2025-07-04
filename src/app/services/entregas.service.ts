import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DetalhesEntregaResponse {
  id: number;
  valor: number;
  entregador: { nome: string };
  origem: { endereco: string };
  destino: { endereco: string };
  status: string;
}

@Injectable({
  providedIn: 'root'
})

export class EntregasService {
  private apiUrl = 'http://localhost:3000/entregas';

  constructor(private http: HttpClient) {}

  listarEntregas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listar`);
  }

  obterDetalhesEntregaEspecifica(idEntrega: string): Observable<DetalhesEntregaResponse> {
    return this.http.get<DetalhesEntregaResponse>(`${this.apiUrl}/detalhes/${idEntrega}`); 
  }
}