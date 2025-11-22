import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Order } from '../../order.model';
import { OrderService } from '../../order.service';

@Component({
  selector: 'app-budget-request',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor],
  templateUrl: './budget-request.component.html',
  styles: [`
    /* Estilos existentes que já devem estar em budget-request.component.css */
    .budget-container {
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .header { text-align: center; margin-bottom: 30px; }
    .header h2 { font-size: 2rem; color: #333; margin-bottom: 10px; }
    .header p { color: #6c757d; }
    .info-message {
      background-color: #fdecea; /* Fundo vermelho claro */
      border-left: 5px solid #dc3545; /* Borda vermelha */
      padding: 12px 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #5d121a; /* Texto vermelho escuro */
      font-size: 0.9rem;
      font-weight: 500;
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px 40px; }
    .form-group { margin-bottom: 0; }
    .form-group-full { grid-column: 1 / -1; }
    label { display: block; margin-bottom: 8px; font-weight: 600; color: #495057; }
    input[type="text"], input[type="tel"], input[type="email"], select, textarea { width: 100%; padding: 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #28a745; box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.15); }
    .form-actions { text-align: center; margin-top: 30px; }
    .submit-btn { background-color: #28a745; color: white; padding: 14px 30px; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s, transform 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
    .submit-btn:hover { background-color: #218838; transform: translateY(-2px); }
    .field-error-message { color: #dc3545; font-size: 0.875rem; margin-top: 5px; }
    .form-error-message { color: #dc3545; text-align: center; margin-bottom: 15px; }
    .is-invalid { border-color: #dc3545 !important; }
    .submission-feedback { text-align: center; padding: 40px; }
    .submission-feedback.success h3 { color: #28a745; font-size: 1.8rem; }
    .submission-feedback p { font-size: 1.1rem; color: #495057; margin-bottom: 30px; }

    /* Novos estilos para o botão */
    .btn-outline {
      background-color: transparent;
      color: #28a745;
      border: 2px solid #28a745;
    }

    .btn-outline:hover {
      background-color: #28a745;
      color: white;
    }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class BudgetRequestComponent {
  model: Partial<Order> = {};
  formSubmitted = false;
  submissionSuccess = false;
  submissionMessage = '';
  submissionTitle = '';

  services = ['Outdoor', 'Banner', 'Faixa', 'Adesivo', 'Placa'];
  private orderService = inject(OrderService);

  constructor() {
    this.resetForm();
  }

  @ViewChild('customerDocumentInp', { static: false })
  customerDocumentInp?: ElementRef<HTMLInputElement>;

  formatDocument(event?: Event): void {
    const input = (event?.target as HTMLInputElement) ?? this.customerDocumentInp?.nativeElement;
    if (!input) return;

    // Remove non-digits
    let raw = input.value.replace(/\D/g, '');

    // Enforce max digits: 11 for CPF, 14 for CNPJ
    const maxDigits = raw.length <= 11 ? 11 : 14;
    if (raw.length > maxDigits) {
      raw = raw.slice(0, maxDigits);
      input.value = raw;
      this.model.customerDocument = raw;
    }
  }


  onSubmit(form: NgForm) {
    this.formSubmitted = true;
    if (form.invalid) {
      this.submissionSuccess = false;
      this.submissionMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    // Define o status como 'Orçamento' e salva usando o OrderService
    this.model.status = 'Orçamento';
    this.model.totalPrice = 0; // Preço inicial zero para orçamentos
    
    this.orderService.addOrder(this.model).subscribe({
      next: (savedOrder) => {
        console.log('Orçamento salvo com sucesso!', savedOrder);
        this.submissionSuccess = true;
        this.submissionTitle = 'Parabéns!';
        this.submissionMessage = 'Seu pedido foi enviado com sucesso. Em breve um de nossos consultores entrará em contato para finalizar os detalhes.';
        form.resetForm();
        this.resetForm();
      },
      error: (err) => {
        console.error('ERRO DETALHADO DO SUPABASE:', err);
        this.submissionSuccess = false;
        // Exibe a mensagem de erro real do banco de dados
        this.submissionMessage = `Erro do Banco de Dados: ${err.message}`;
      }
    });
  }

  private resetForm(): void {
    this.model = {
      customerName: '',
      customerDocument: '',
      customerPhone: '',
      customerEmail: '',
      serviceName: '',
      description: '',
    };
  }
}