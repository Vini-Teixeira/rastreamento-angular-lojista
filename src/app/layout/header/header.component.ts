import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { SocketService } from '../../services/socket.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    NotificationPanelComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  lojaNome: string | null = null;
  private sub = new Subscription();
  private socketService = inject(SocketService)
  public unreadCount$: Observable<number>

  public isPanelVisible = false

  constructor(private authService: AuthService) {
    this.unreadCount$ = this.socketService.unreadCount$
  }

  ngOnInit(): void {
    this.socketService.connect()
    this.sub.add(
      this.authService.loja$.subscribe((loja) => {
        this.lojaNome = loja?.nome || null;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onBellClick(): void {
    this.isPanelVisible = !this.isPanelVisible;
    if (this.isPanelVisible) {
      this.socketService.markAllAsRead();
    }
  }
  closePanel(): void {
    if (this.isPanelVisible) {
      this.isPanelVisible = false;
    }
  }
}
