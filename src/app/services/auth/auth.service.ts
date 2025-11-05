import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface LojaInfo {
  id: string;
  nome: string;
}

interface DecodedToken {
  sub: string;
  nome?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  private apiUrl = `${environment.apiUrl}`;
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();

  private lojaSubject = new BehaviorSubject<LojaInfo | null>(null);
  loja$ = this.lojaSubject.asObservable();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loggedIn.next(this.hasToken());
      this.restoreLojaInfo();
    }
  }

  private hasToken(): boolean {
    if (this.isBrowser) {
      return !!localStorage.getItem('lojista_token');
    }
    return false;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/lojistas/login`, credentials).pipe(
      tap((response) => {
        if (this.isBrowser && response && response.access_token) {
          localStorage.setItem('lojista_token', response.access_token);
          this.loggedIn.next(true);
          this.decodeAndStoreLoja(response.access_token);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('lojista_token');
      localStorage.removeItem('loja_info');
      this.loggedIn.next(false);
      this.lojaSubject.next(null);
      this.router.navigate(['/card-login']);
    }
  }

  registerLojista(lojistaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/lojistas`, lojistaData);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('lojista_token');
    }
    return null;
  }

  private decodeAndStoreLoja(token: string): void {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const loja: LojaInfo = {
        id: decoded.sub,
        nome: decoded.nome || 'Loja',
      };
      this.lojaSubject.next(loja);
      localStorage.setItem('loja_info', JSON.stringify(loja));
    } catch (e) {
      console.error('Erro ao decodificar token JWT:', e);
    }
  }

  private restoreLojaInfo(): void {
    if (!this.isBrowser) return;

    const token = this.getToken();
    const saved = localStorage.getItem('loja_info');

    if (saved) {
      this.lojaSubject.next(JSON.parse(saved));
    } else if (token) {
      this.decodeAndStoreLoja(token);
    }
  }

  getLojaAtual(): LojaInfo | null {
    return this.lojaSubject.value;
  }
}
