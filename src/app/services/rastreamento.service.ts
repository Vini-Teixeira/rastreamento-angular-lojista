import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RastreamentoService {
  private entregadorLocationSubject = new Subject<google.maps.LatLng>();
  entregadorLocation$ = this.entregadorLocationSubject.asObservable();

  constructor(private http: HttpClient) {} // Injete o HttpClient

  buscarLocalizacaoPorTelefone(telefone: string) {
    return this.http.get<{ lat: number; lng: number }>(`/entregadores/localizacao/${telefone}`);
  }

  iniciarRastreamento(telefone: string) {
    setInterval(() => {
      this.buscarLocalizacaoPorTelefone(telefone).subscribe((localizacao) => {
        if (localizacao) {
          this.entregadorLocationSubject.next(new google.maps.LatLng(localizacao));
        }
      });
    }, 3000);
  }
}