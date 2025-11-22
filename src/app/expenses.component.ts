import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Expense } from './expense.model';
import { ExpenseService } from './expense.service';
import { ExpenseModalComponent } from './expense-modal.component';
import { ConfirmationModalComponent } from '../../confirmation-modal.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ExpenseModalComponent, ConfirmationModalComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
  allExpenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  totalAmount = 0;
  currentFilter: 'all' | '7' | '30' | '60' | 'month' = 'all';

  availableYears: number[] = [];
  selectedMonth!: number;
  selectedYear!: number;

  isModalOpen = false;
  isConfirmModalOpen = false;
  currentExpense: Expense | null = null;
  expenseToDeleteId: number | null = null;
  confirmMessage = '';

  months = [
    { value: 1, name: 'Janeiro' }, { value: 2, name: 'Fevereiro' }, { value: 3, name: 'Março' },
    { value: 4, name: 'Abril' }, { value: 5, name: 'Maio' }, { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' }, { value: 8, name: 'Agosto' }, { value: 9, name: 'Setembro' },
    { value: 10, name: 'Outubro' }, { value: 11, name: 'Novembro' }, { value: 12, name: 'Dezembro' }
  ];

  // Injetamos o ChangeDetectorRef para forçar a atualização da tela se necessário
  constructor(private expenseService: ExpenseService, private cdr: ChangeDetectorRef) {
    console.log('1. Construtor inciado');
  }

  ngOnInit(): void {
    console.log('2. ngOnInit disparado - Iniciando carregamento...');
    this.loadExpenses();
  }

  loadExpenses(): void {
    console.log('3. loadExpenses chamado. Buscando no Supabase...');
    
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        console.log('4. DADOS CHEGARAM DO SUPABASE!', expenses); // <-- Olhe aqui no console
        
        if (expenses.length === 0) {
          console.warn('⚠️ O Supabase retornou uma lista vazia ([]).');
        }

        this.allExpenses = expenses;
        this.populateFilterData(); // Configura os filtros
        this.applyFilters(); // Aplica os filtros
        
        console.log('5. Dados filtrados finais:', this.filteredExpenses); // <-- E aqui
        
        // Força o Angular a verificar a tela (caso algo esteja travado)
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ ERRO CRÍTICO ao buscar despesas:', err);
      }
    });
  }

  private populateFilterData(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    const years = new Set(this.allExpenses.map(e => new Date(e.date).getFullYear()));
    if (!years.has(this.selectedYear)) {
      years.add(this.selectedYear);
    }
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    
    // Vamos garantir que o filtro padrão seja 'all'
    this.currentFilter = 'all'; 
  }

  applyFilters(): void {
    console.log('Aplicando filtros. Filtro atual:', this.currentFilter);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (this.currentFilter === 'month') {
      this.filteredExpenses = this.allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === this.selectedYear &&
               expenseDate.getMonth() + 1 === this.selectedMonth;
      });
    } else if (this.currentFilter === 'all') {
      this.filteredExpenses = [...this.allExpenses];
    } else {
      const daysToSubtract = parseInt(this.currentFilter, 10);
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
      startDate.setHours(0, 0, 0, 0);

      this.filteredExpenses = this.allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= now;
      });
    }
    this.calculateTotal();
  }

  private calculateTotal(): void {
    this.totalAmount = this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  // --- MÉTODOS DO MODAL (Inalterados) ---
  openAddModal(): void {
    this.currentExpense = null;
    this.isModalOpen = true;
  }

  openEditModal(expense: Expense): void {
    this.currentExpense = { ...expense };
    this.isModalOpen = true;
  }

  handleExpenseSubmit(expense: Expense): void {
    const operation = (this.currentExpense && this.currentExpense.id)
      ? this.expenseService.updateExpense({ ...expense, id: this.currentExpense.id, date: new Date(expense.date) })
      : this.expenseService.addExpense(expense);

    operation.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.currentExpense = null;
        this.loadExpenses();
      },
      error: (err) => console.error('Erro ao salvar despesa', err)
    });
  }

  openDeleteConfirmModal(expense: Expense): void {
    this.expenseToDeleteId = expense.id;
    this.confirmMessage = `Tem certeza que deseja excluir a despesa "${expense.description}"?`;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.expenseToDeleteId = null;
  }

  confirmDelete(): void {
    if (this.expenseToDeleteId === null) return;
    this.expenseService.deleteExpense(this.expenseToDeleteId).subscribe({
      next: () => {
        this.loadExpenses();
        this.closeConfirmModal();
      },
      error: (err) => console.error('Erro ao excluir despesa', err)
    });
  }
  
  setFilter(period: 'all' | '7' | '30' | '60' | 'month'): void {
    this.currentFilter = period;
    this.applyFilters();
  }
}