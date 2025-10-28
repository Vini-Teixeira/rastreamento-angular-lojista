import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapLoaderService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiKey = environment.googleMapsApiKey;

  private apiLoaded = new BehaviorSubject<boolean>(false);
  public apiLoaded$: Observable<boolean> = this.apiLoaded.asObservable();

  constructor() {}
  public init(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }
    
    if (this.apiLoaded.getValue() || document.getElementById('google-maps-script')) {
      if (!this.apiLoaded.getValue()) {
         this.apiLoaded.next(true);
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.apiLoaded.next(true);
        console.log('Google Maps API carregada com sucesso (via APP_INITIALIZER)!');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Erro ao carregar o script do Google Maps.', error);
        this.apiLoaded.next(false);
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }
}