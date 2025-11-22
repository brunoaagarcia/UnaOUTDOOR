import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Expense } from './expense.model';

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>{{ isEditMode ? 'Editar Despesa' : 'Adicionar Nova Despesa' }}</h2>
        <form #expenseForm="ngForm" (ngSubmit)="onSubmit(expenseForm)">
          <div class="form-group">
            <label for="descricao">Descrição</label>
            <input type="text" id="description" [(ngModel)]="model.description" name="description" required />
          </div>
          <div class="form-group">
            <label for="valor">Valor</label>
            <div class="input-group">
              <span class="input-group-text">R$</span>
              <input type="number" id="amount" [(ngModel)]="model.amount" name="amount" required min="0" step="0.01" />
            </div>
          </div>
          <div class="form-group">
            <label for="date">Data</label>
            <input type="date" id="date" [(ngModel)]="dateValue" name="date" required />
          </div>

          <div *ngIf="formSubmitted && expenseForm.invalid" class="form-error-message">
            Por favor, preencha todos os campos obrigatórios.
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button type="submit" class="btn-primary">{{ isEditMode ? 'Salvar Alterações' : 'Adicionar Despesa' }}</button>
          </div>
        </form>
        <button class="close-button" (click)="onClose()">×</button>
      </div>
    </div>
  `,
  styleUrl: '../../add-order-modal.component.css', // Reutilizando o CSS do modal de pedidos
})
export class ExpenseModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() expenseToEdit: Expense | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() expenseSubmit = new EventEmitter<Expense>();

  isEditMode = false;
  model: Partial<Expense> = {};
  dateValue = '';
  formSubmitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.formSubmitted = false;
      this.isEditMode = !!this.expenseToEdit;
      if (this.isEditMode && this.expenseToEdit) {
        this.model = { ...this.expenseToEdit };
        // Converte date para formato YYYY-MM-DD para o input date
        const date = new Date(this.expenseToEdit.date);
        this.dateValue = date.toISOString().split('T')[0];
      } else {
        this.model = { description: '', amount: 0 };
        // Data padrão é hoje
        const today = new Date();
        this.dateValue = today.toISOString().split('T')[0];
      }
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;
    if (form.invalid) return;

    // Converte dateValue de volta para Date
    const expense = { ...this.model, date: new Date(this.dateValue) } as Expense;
    this.expenseSubmit.emit(expense);
  }
}