import { Component, HostListener } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})

export class LandingPageComponent {

  // Referente ao SmoothScroll da Landing Page
  smoothScrollTo(target: string, duration: number = 1000) {
    const element = document.querySelector(target);
    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top;
    const startPosition = window.pageYOffset;
    const distance = targetPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(
        timeElapsed,
        startPosition,
        distance,
        duration
      );
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  }

  easeInOutQuad(t: number, b: number, c: number, d: number): number {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    const target = (event.target as HTMLElement).getAttribute('href');
    if (target && target.startsWith('#')) {
      event.preventDefault();
      this.smoothScrollTo(target, 1000);
    }
  }
}
