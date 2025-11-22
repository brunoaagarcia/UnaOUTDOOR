import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Order } from '../../order.model';
import { OrderService } from '../../order.service';
import { AddOrderModalComponent } from "../../add-order-modal.component";
import { ConfirmationModalComponent } from "../../confirmation-modal.component";

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AddOrderModalComponent, ConfirmationModalComponent, DatePipe],
  template: `
    <div class="order-management-container">
      <div class="page-navigation">
        <a routerLink="/admin" class="back-btn">&larr; Voltar ao Dashboard</a>
      </div>
      <div class="header no-border">
        <div>
          <h2>Gerenciamento de Orçamentos</h2>
          <p class="subtitle">Analise as solicitações de orçamento e converta-as em pedidos.</p>
        </div>
      </div>

      <app-add-order-modal
        [isOpen]="isModalOpen"
        [orderToEdit]="currentOrder"
        (closeModal)="isModalOpen = false"
        (orderSubmit)="handleOrderSubmit($event)"></app-add-order-modal>
      <app-confirmation-modal
        [isOpen]="isConfirmModalOpen"
        [message]="confirmMessage"
        (confirm)="confirmDelete()"
        (cancel)="closeConfirmModal()">
      </app-confirmation-modal>

      <div class="order-list">
        <div class="filter-container with-icon">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="filter-input"
            placeholder="Buscar por nome ou CPF do cliente..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterOrders()" />
        </div>

        <div class="empty-state" *ngIf="filteredOrders.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.25 8.84a8.93 8.93 0 0 0-2.09-2.77l-1.53-1.53a2.5 2.5 0 0 0-3.54 0l-5.56 5.56a2.5 2.5 0 0 0 0 3.54l1.53 1.53a8.93 8.93 0 0 0 2.77 2.09"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            <h4>Nenhum Orçamento Encontrado</h4>
            <p>
              Ainda não há solicitações de orçamento. Assim que um cliente solicitar,
              ele aparecerá aqui.
            </p>
        </div>

        <div class="table-container" *ngIf="filteredOrders.length > 0">
          <table class="order-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Serviço</th>
                <th>Data</th>
                <th class="actions-header">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredOrders">
                <td><span class="order-id">#{{ order.formattedDisplayId }}</span></td>
                <td><span class="customer-name">{{ order.customerName }}</span></td>
                <td>{{ order.customerPhone }}</td>
                <td>{{ order.serviceName }}</td>
                <td>{{ order.orderDate | date:'dd/MM/yyyy' }}</td>
                <td class="actions-cell">
                  <button class="action-btn edit-btn" (click)="openEditModal(order)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Analisar</button>
                  <button class="action-btn whatsapp-btn" (click)="sendWhatsApp(order)" [disabled]="!order.customerPhone" title="{{!order.customerPhone ? 'Cliente sem telefone' : 'Enviar WhatsApp'}}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.068-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.1-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
</svg> WhatsApp</button>
                  <button class="action-btn delete-btn" (click)="openDeleteConfirmModal(order)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Excluir</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Importa e estende o CSS existente */
    @import '../../order-list.component.css';

    .order-management-container {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border: 1px solid #e9ecef;
      padding: 30px;
    }

    .subtitle {
      color: #6c757d;
      font-size: 1rem;
      margin-top: -15px;
    }

    .header.no-border {
      border-bottom: none;
      padding-bottom: 0;
      text-align: left;
    }

    .filter-container.with-icon {
      margin-bottom: 30px; /* Aumenta o espaço abaixo da busca */
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af; /* Cor do ícone um pouco mais escura */
      pointer-events: none;
    }

    .filter-input {
      width: 100%;
      padding: 12px 15px;
      font-size: 1rem;
      border-radius: 6px;
      border: none; /* Remove a borda padrão */
      background-color: #f3f4f6; /* Fundo sutil */
      padding-left: 45px;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .filter-input:focus {
      outline: none;
      background-color: #fff;
      border: 1px solid #ccc;
      box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-top: 20px;
    }

    .empty-state svg {
      color: #adb5bd;
      margin-bottom: 16px;
    }

    .empty-state h4 {
      font-size: 1.25rem;
      color: #343a40;
      margin: 0 0 8px;
    }

    .empty-state p {
      color: #6c757d;
      max-width: 400px;
      margin: 0 auto;
    }

    /* Estilos da Tabela */
    .table-container {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 20px;
    }

    .order-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .order-id {
      font-weight: normal;
    }

    .order-table th {
      background-color: #f8f9fa;
      color: #495057;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #dee2e6;
      padding: 12px 15px;
    }

    .order-table td {
      padding: 15px;
      color: #495057;
      border-bottom: 1px solid #e9ecef;
      vertical-align: middle;
    }
    
    .order-table td:nth-child(1),
    .order-table td:nth-child(2),
    .order-table td:nth-child(3),
    .order-table td:nth-child(4),
    .order-table td:nth-child(5) {
      color: black !important;
    }

    .order-table tbody tr:last-child td {
      border-bottom: none;
    }

    .order-table tbody tr:hover {
      background-color: #f1f3f5;
    }

    .customer-name {
      font-weight: 600;
      color: #212529;
    }

    .actions-header {
      text-align: right;
    }

    .actions-cell {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    /* Estilo específico para o status de Orçamento */
    .status-orcamento {
      background-color: #17a2b8; /* ciano */
      color: white;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn.edit-btn {
      background-color: #28a745; /* verde */
      color: white;
    }

    .action-btn.edit-btn:hover {
      background-color: #218838;
      transform: translateY(-1px);
    }

    .action-btn.whatsapp-btn {
      background-color: #25D366;
      color: white;
    }

    .action-btn.whatsapp-btn:hover {
      background-color: #1EBE57;
      transform: translateY(-1px);
    }

    .delete-btn {
      background-color: #f1f3f5;
      color: #495057;
    }

    .delete-btn:hover {
      background-color: #e43a4b;
      color: white;
      transform: translateY(-1px);
    }
  `]
})
export class BudgetListComponent {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchTerm = '';

  isModalOpen = false;
  currentOrder: Order | null = null;
  isConfirmModalOpen = false;
  orderToDeleteId: string | null = null;
  confirmMessage = '';

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {
    this.loadBudgets();
  }

  loadBudgets(): void {
    // Carrega todos os pedidos e filtra apenas os que são 'Orçamento'
    this.orderService.getOrders()
      .pipe(
        map(orders => orders
          .filter(o => o.status === 'Orçamento')
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .map((order, index) => ({
            ...order,
            displayId: index + 1,
            formattedDisplayId: String(index + 1).padStart(2, '0')
          }))
        )
      )
      .subscribe(filteredAndSortedOrders => {
        this.orders = filteredAndSortedOrders;
        this.filterOrders();
        this.cdr.detectChanges(); // Force Angular to detect changes and update the view
      });
  }

  filterOrders(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order =>
      order.customerName.toLowerCase().includes(term) ||
      (order.customerDocument && order.customerDocument.replace(/[.-]/g, '').includes(term.replace(/[.-]/g, '')))
    );
  }

  openEditModal(order: Order): void {
    this.currentOrder = order;
    this.isModalOpen = true;
  }

  handleOrderSubmit(order: Order) {
    this.orderService.updateOrder(order).subscribe({
      next: () => {
        this.isModalOpen = false;
        this.currentOrder = null;
        this.loadBudgets();
      },
      error: (err) => {
        console.error('Erro ao atualizar orçamento', err);
      }
    });
  }

  openDeleteConfirmModal(order: Order): void {
    this.orderToDeleteId = order.id;
    this.confirmMessage = `Tem certeza que deseja excluir o orçamento de ${order.customerName}?`;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.orderToDeleteId = null;
  }

  confirmDelete(): void {
    if (this.orderToDeleteId === null) return;
    this.orderService.deleteOrder(this.orderToDeleteId).subscribe({
      next: () => {
        this.loadBudgets();
        this.closeConfirmModal();
      },
      error: (err) => console.error('Erro ao excluir orçamento', err),
    });
  }

  sendWhatsApp(order: Order): void {
    if (!order.customerPhone) {
      alert('O cliente não possui um número de telefone cadastrado.');
      return;
    }
    const phone = order.customerPhone.replace(/\D/g, '');
    
    // Monta mensagem detalhada com informações do pedido
    const message = `*Detalhamento do seu Orçamento*

📋 *Dados do Cliente:*
Nome: ${order.customerName}
CPF/CNPJ: ${order.customerDocument || 'Não informado'}
Telefone: ${order.customerPhone}
Email: ${order.customerEmail || 'Não informado'}

🎯 *Serviço Solicitado:*
Tipo: ${order.serviceName}

📝 *Descrição do Projeto:*
${order.description || 'Não informado'}

📅 *Data da Solicitação:*
${order.orderDate ? new Date(order.orderDate).toLocaleDateString('pt-BR') : 'Não informado'}

---
O orçamento para o serviço solicitado é de R$`;
    
    const url = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}