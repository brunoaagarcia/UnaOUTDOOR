import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './src/app/service/auth.service';
import { ThemeService } from './src/app/service/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <button type="button" class="theme-toggle" (click)="themeService.toggleTheme()" [attr.aria-pressed]="themeService.isDark()" aria-label="Alternar tema">
          <span *ngIf="themeService.isDark()">☀️</span>
          <span *ngIf="!themeService.isDark()">🌙</span>
        </button>
        <h2>UNA OUTDOOR - ADMIN</h2>
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required>
          </div>
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
          <button type="submit" class="login-btn">Entrar</button>
          <div class="budget-link">
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  themeService = inject(ThemeService);

  async onLogin(): Promise<void> {
    this.errorMessage = null;
    this.cdr.markForCheck();
    try {
      const { data, error } = await this.authService.signIn(this.email, this.password);

      if (error) {
        // Se houver um erro na resposta do Supabase (ex: credenciais inválidas)
        this.errorMessage = 'Usuário ou senha inválidos. Por favor, tente novamente.';
      } else if (data.session) {
        // Se o login for bem-sucedido
        await this.router.navigate(['/admin']);
      } else {
        // Caso inesperado onde não há erro nem sessão
        this.errorMessage = 'Falha na autenticação. Tente novamente mais tarde.';
      }
    } catch (err: any) {
      // Captura erros de rede ou outras exceções
      this.errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
    } finally {
      // Garante que a UI seja atualizada com a mensagem de erro
      this.cdr.markForCheck();
    }
  }
}