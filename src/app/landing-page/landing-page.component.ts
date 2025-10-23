import { Component, AfterViewInit, HostListener } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink, MatIconModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements AfterViewInit {

  constructor() {
    gsap.registerPlugin(ScrollToPlugin);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initIntroAnimations();
    }, 0); 
  }

  private initIntroAnimations(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.anim-fade-in', { opacity: 1, y: 0, duration: 1 });
    tl.to('.anim-header-item', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, '-=0.5');
    tl.to('.anim-title', { opacity: 1, y: 0, duration: 1 }, '-=0.5');
    tl.to('.anim-subtitle', { opacity: 1, y: 0, duration: 1 }, '-=0.7');
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    const targetEl = event.target as HTMLElement;
    const targetHref = targetEl.closest('a')?.getAttribute('href');

    if (targetHref && targetHref.startsWith('#')) {
      event.preventDefault();
      gsap.to(window, { duration: 1.5, scrollTo: targetHref, ease: 'power2.inOut' });
    }
  }
}