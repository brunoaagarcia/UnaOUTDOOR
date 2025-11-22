import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Order } from './order.model';

@Component({
  selector: 'app-add-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor],
  templateUrl: './add-order-modal.component.html',
  styleUrl: './add-order-modal.component.css',
})
export class AddOrderModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() orderToEdit: Order | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() orderSubmit = new EventEmitter<Order>();

  isEditMode = false;
  model: Partial<Order> = {};
  formSubmitted = false;
  initialStatus: Order['status'] | '' = '';

  services = ['Outdoor', 'Banner', 'Faixa', 'Adesivo', 'Placa'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.formSubmitted = false; // Reseta o estado de submissão ao abrir o modal
      this.isEditMode = !!this.orderToEdit;
      if (this.isEditMode && this.orderToEdit) {
        // Clonar o objeto para não modificar o original diretamente
        this.model = { ...this.orderToEdit };
        this.initialStatus = this.orderToEdit.status;
      } else {
        this.resetForm();
      }
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  onPaymentMethodChange() {
    if (this.model.formaPagamento === 'À vista') {
      this.model.installments = undefined;
    }
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;
    if (form.invalid) {
      // A mensagem de erro agora é mostrada no template
      return;
    }

    this.orderSubmit.emit(this.model as Order);
    this.onClose();
  }

  private resetForm(): void {
    this.formSubmitted = false;
    this.model = {
      customerName: '',
      customerDocument: '',
      customerPhone: '',
      customerEmail: '',
      serviceName: '',
      status: 'Pendente',
      totalPrice: 0,
      height: undefined,
      width: undefined,
      length: undefined,
      description: '',
      pago: false,
      formaPagamento: 'À vista',
      installments: undefined,
    };
  }
}