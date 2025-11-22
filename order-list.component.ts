import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Order } from './order.model';
import { OrderService } from './order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddOrderModalComponent } from './add-order-modal.component';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AddOrderModalComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
})
export class OrderListComponent implements OnInit {
  private readonly _orderService: OrderService;
  private readonly _cdr: ChangeDetectorRef;

  public orders: Order[] = [];
  public filteredOrders: Order[] = [];
  public searchTerm: string = '';
  public isModalOpen: boolean = false;
  public currentOrder: Order | null = null;
  public isConfirmModalOpen: boolean = false;
  public orderToDeleteId: string | null = null;
  public confirmMessage: string = '';

  constructor(orderService: OrderService, cdr: ChangeDetectorRef) {
    this._orderService = orderService;
    this._cdr = cdr;
  }

  public ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this._orderService.getOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders = orders
          .filter((order: Order) => order && order.status !== 'Orçamento')
          .map((order: Order, index: number) => ({
            ...order,
            displayId: index + 1,
            formattedDisplayId: String(index + 1).padStart(2, '0'),
          }));
        this.filterOrders();
        this._cdr.detectChanges();
      },
      error: (error: Error) => console.error('Erro ao carregar pedidos:', error)
    });
  }

  public filterOrders(): void {
    const term: string = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(
      (order: Order) =>
        order &&
        (order.customerName.toLowerCase().includes(term) ||
          order.customerDocument.replace(/[.-]/g, '').includes(term.replace(/[.-]/g, '')))
    );
  }

  public openAddModal(): void {
    this.currentOrder = null;
    this.isModalOpen = true;
  }

  public openEditModal(order: Order): void {
    this.currentOrder = { ...order };
    this.isModalOpen = true;
  }

  public handleOrderSubmit(orderData: Partial<Order>): void {
    let operation: Observable<unknown>;

    if (this.currentOrder) {
      operation = this._orderService.updateOrder({
        ...this.currentOrder,
        ...orderData,
        id: this.currentOrder.id,
      });
    } else {
      operation = this._orderService.addOrder(orderData);
    }

    operation.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.currentOrder = null;
        this._orderService.refreshOrders().subscribe(() => {
          this.loadOrders();
        });
      },
      error: (error: Error) => {
        console.error('Erro detalhado ao salvar pedido:', error);
        alert(`Erro ao salvar o pedido: ${error.message}`);
      },
    });
  }

  public openDeleteConfirmModal(order: Order): void {
    this.orderToDeleteId = order.id;
    this.confirmMessage = `Tem certeza que deseja excluir o pedido #${order.id} de ${order.customerName}?`;
    this.isConfirmModalOpen = true;
  }

  public closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.orderToDeleteId = null;
  }

  public confirmDelete(): void {
    if (this.orderToDeleteId === null) {
      return;
    }

    this._orderService.deleteOrder(this.orderToDeleteId).subscribe({
      next: () => {
        this._orderService.refreshOrders().subscribe(() => {
          this.loadOrders();
          this.closeConfirmModal();
        });
      },
      error: (error: Error) => console.error('Erro ao excluir pedido:', error)
    });
  }

  public generateReceipt(order: Order): void {
    const dimensionsContent = `
      ${order.height ? `<div class="info-item"><strong>Altura:</strong> <span>${order.height} m</span></div>` : ''}
      ${order.width ? `<div class="info-item"><strong>Largura:</strong> <span>${order.width} m</span></div>` : ''}
      ${order.length ? `<div class="info-item"><strong>Comprimento:</strong> <span>${order.length} m</span></div>` : ''}
    `;

    const descriptionContent = order.description
      ? `<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;"><strong style="display: block; margin-bottom: 8px; color: #333;">Observações:</strong><p style="margin:0; white-space: pre-wrap; word-wrap: break-word; color: #555;">${order.description}</p></div>`
      : '';

    const receiptContent = `
      <div id="receipt-container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Comprovante do Pedido #${order.formattedDisplayId}</h1>

        <div style="margin-top: 20px;">
          <h2 style="font-size: 1.2em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">Detalhes do Cliente</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="margin-bottom: 10px;"><strong>Cliente:</strong> <span>${order.customerName}</span></div>
            <div style="margin-bottom: 10px;"><strong>CPF:</strong> <span>${order.customerDocument}</span></div>
            <div style="margin-bottom: 10px;"><strong>Email:</strong> <span>${order.customerEmail || 'N/A'}</span></div>
            <div style="margin-bottom: 10px;"><strong>Telefone:</strong> <span>${order.customerPhone || 'N/A'}</span></div>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h2 style="font-size: 1.2em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">Detalhes do Pedido</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="margin-bottom: 10px;"><strong>Serviço:</strong> <span>${order.serviceName}</span></div>
            <div style="margin-bottom: 10px;"><strong>Status:</strong> <span>${order.status}</span></div>
            <div style="margin-bottom: 10px;"><strong>Data do Pedido:</strong> <span>${order.orderDate ? new Date(order.orderDate).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
            <div style="margin-bottom: 10px;"><strong>Preço Total:</strong> <span>${order.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            ${order.pago ? `
              <div style="margin-bottom: 10px;"><strong>Situação:</strong> <span style="color: #28a745; font-weight: bold;">Pago</span></div>
              <div style="margin-bottom: 10px;"><strong>Forma de Pagamento:</strong> <span>${order.formaPagamento}${order.formaPagamento === 'Parcelado' && order.installments ? ` (${order.installments}x)` : ''}</span></div>
            ` : `
              <div style="margin-bottom: 10px;"><strong>Situação:</strong> <span style="color: #dc3545; font-weight: bold;">Não Pago</span></div>
            `}
            ${dimensionsContent}
          </div>
        </div>

        ${descriptionContent}

        <div style="text-align: center; margin-top: 30px; font-size: 0.8em; color: #888;">
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    `;

    const receiptElement = document.createElement('div');
    receiptElement.style.position = 'absolute';
    receiptElement.style.left = '-9999px';
    receiptElement.innerHTML = receiptContent;
    document.body.appendChild(receiptElement);

    const elementToCapture = document.getElementById('receipt-container');

    if (elementToCapture) {
      html2canvas(elementToCapture, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`comprovante-pedido-${order.formattedDisplayId}.pdf`);
        document.body.removeChild(receiptElement);
      });
    } else {
      document.body.removeChild(receiptElement);
    }
  }
}