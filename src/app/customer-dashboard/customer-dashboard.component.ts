import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth-folder/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CustomerDashboardComponent implements OnInit {
  customerData: any;
  orders: any[] = [];
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCustomerData();
    this.loadCustomerOrders();
  }

  loadCustomerData() {
    this.authService.getCurrentCustomer().subscribe({
      next: (data) => {
        this.customerData = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar dados do cliente';
        this.loading = false;
      }
    });
  }

  loadCustomerOrders() {
    this.authService.getCustomerOrders().subscribe({
      next: (data) => {
        this.orders = data;
      },
      error: (error) => {
        this.error = 'Erro ao carregar pedidos';
      }
    });
  }

  onLogout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/customer-login']);
    });
  }
}