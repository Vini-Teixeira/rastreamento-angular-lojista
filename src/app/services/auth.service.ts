import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = 'http://localhost:3000/auth';

  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  private isBrowser: boolean;
  

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

  registerLojista(lojistaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/lojista/register`, lojistaData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/lojista/login`, credentials).pipe(
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

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('lojista_token');
    }
    return null;
  }
}
