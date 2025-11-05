import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  lojaNome: string | null = null;
  private sub = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.sub.add(
      this.authService.loja$.subscribe((loja) => {
        this.lojaNome = loja?.nome || null;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
