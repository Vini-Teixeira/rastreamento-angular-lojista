import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';

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

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loggedIn.next(this.hasToken());
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
        }
      })
    );
}

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('lojista_token');
      this.loggedIn.next(false);
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
}
