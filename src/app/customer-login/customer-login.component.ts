import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-customer-login',
  templateUrl: './customer-login.component.html',
  styleUrl: './customer-login.component.css',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule]
})
export class CustomerLoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }
    this.authService.customerLogin(this.email, this.password).subscribe({
      next: (response) => {
        // Redirecionar para a página inicial após o login
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = 'Email ou senha inválidos';
        console.error('Erro no login:', error);
      }
    });
  }
}