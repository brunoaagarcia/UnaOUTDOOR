import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './src/app/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-container">
      <header class="admin-header">
        <a routerLink="/dashboard" class="logo">UNA OUTDOOR</a>
        <nav>
          <a routerLink="/admin/orcamentos" routerLinkActive="active">Gerenciar Orçamentos</a>
          <a routerLink="/admin/pedidos" routerLinkActive="active">Gerenciar Pedidos</a>
          <a routerLink="/admin/relatorios" routerLinkActive="active">Relatórios</a>
          <a routerLink="/admin/despesas" routerLinkActive="active">Despesas</a>
          <a href="#" class="logout-link" (click)="logout(); $event.preventDefault()">Sair</a>
        </nav>
      </header>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}