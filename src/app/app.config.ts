import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  PLATFORM_ID,
  inject,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './services/auth/auth.interceptor';
import { MapLoaderService } from './services/map-loader.service';
import { ToastrModule } from 'ngx-toastr';
import { MatDialogModule } from '@angular/material/dialog';

export function initializeGoogleMaps(): () => Promise<void> {
  const mapLoader = inject(MapLoaderService);
  const platformId = inject(PLATFORM_ID);
  return () => mapLoader.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-bottom-right',
        preventDuplicates: true,
        closeButton: true,
        timeOut: 6000,
        extendedTimeOut: 2000
      })
    ),
    importProvidersFrom(MatDialogModule),
    //provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeGoogleMaps,
      multi: true,
    },
  ],
};