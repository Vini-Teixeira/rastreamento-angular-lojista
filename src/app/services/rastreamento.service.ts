import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, interval, switchMap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RastreamentoService {
  private entregadorLocationSubject = new Subject<google.maps.LatLng>();
  entregadorLocation$ = this.entregadorLocationSubject.asObservable();
  
  private http = inject(HttpClient); 
  private apiUrl = `${environment.apiUrl}/entregadores`;

  iniciarRastreamento(telefone: string) {
    interval(5000)
      .pipe(
        switchMap(() => 
          this.http.get<{ lat: number; lng: number }>(`${this.apiUrl}/localizacao/${telefone}`)
        ),
        catchError(error => {
          console.error('Falha ao buscar localização:', error);
          return EMPTY; 
        })
      )
      .subscribe(localizacao => {
        if (localizacao) {
          this.entregadorLocationSubject.next(new google.maps.LatLng(localizacao.lat, localizacao.lng));
        }
      });
  }
}