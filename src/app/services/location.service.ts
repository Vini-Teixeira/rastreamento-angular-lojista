import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private location: google.maps.LatLng | null = null;

  getLocation(): google.maps.LatLng | null {
    return this.location;
  }

  setLocation(location: google.maps.LatLng) {
    this.location = location;
  }
}