import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment'; 

@Injectable({
  providedIn: 'root',
})
export class MapLoaderService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);


  private apiKey = environment.googleMapsApiKey;

  private apiLoaded = new BehaviorSubject<boolean>(false);
  public apiLoaded$ = this.apiLoaded.asObservable();

  constructor() {
    this.loadScript();
  }

  private loadScript(): void {
    if (!this.isBrowser) {
      return;
    }
    if (document.getElementById('google-maps-script')) {
      this.apiLoaded.next(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.apiLoaded.next(true);
      console.log('Google Maps API carregada com sucesso!');
    };
    script.onerror = () => {
      console.error('Erro ao carregar o script do Google Maps.');
      this.apiLoaded.next(false);
    };
    document.head.appendChild(script);
  }
}
