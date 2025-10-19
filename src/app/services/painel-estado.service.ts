import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PainelEstadoService {
  private entregaSelecionadaSubject = new BehaviorSubject<any | null>(null)
  public entregaSelecionada$ = this.entregaSelecionadaSubject.asObservable()

  constructor() {}

  public selecionarEntrega(entrega: any): void {
    console.log('PainelEstadoService: Nova entrega selecionada', entrega._id)
    this.entregaSelecionadaSubject.next(entrega)
  }
}