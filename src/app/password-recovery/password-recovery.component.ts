import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../service/theme.service';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule]
})
export class PasswordRecoveryComponent {
  cpf: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  themeService = inject(ThemeService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  formatDocument(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{3}).*/, '$1.$2');
    }
    
    event.target.value = value;
    this.cpf = value;
  }

  async onUpdatePassword() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.cpf || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      return;
    }

    try {
      const { error } = await this.authService.updatePasswordByCpf(this.cpf, this.newPassword);

      if (error) {
        throw error;
      }

      this.successMessage = 'Senha atualizada com sucesso! Você será redirecionado para o login.';
      setTimeout(() => {
        this.router.navigate(['/customer-login']);
      }, 3000);

    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      this.errorMessage = `Erro ao atualizar senha: ${error.message || 'Não foi possível completar a operação.'}`;
    }
  }
}
