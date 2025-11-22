import { Routes } from '@angular/router';
import { LoginComponent } from '../../login.component';
import { OrderListComponent } from '../../order-list.component';
import { DashboardComponent } from '../../dashboard.component';
import { AdminLayoutComponent } from '../../admin-layout.component';
import { ReportsComponent } from '../../reports.component';
import { ExpensesComponent } from './expenses.component';
import { authGuard } from '../../auth.guard';
import { BudgetListComponent } from './budget-list.component';
import { BudgetRequestComponent } from './budget-request.component';
import { CustomerLoginComponent } from './customer-login/customer-login.component';

import { PasswordRecoveryComponent } from './password-recovery/password-recovery.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'customer-login', component: CustomerLoginComponent },
  
  { path: 'password-recovery', component: PasswordRecoveryComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent, canActivate: [authGuard] },
  { path: 'orcamento', component: BudgetRequestComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent }, // Rota padrão para /admin
      { path: 'orcamentos', component: BudgetListComponent }, // Nova rota para orçamentos
      { path: 'pedidos', component: OrderListComponent },
      { path: 'relatorios', component: ReportsComponent },
      { path: 'despesas', component: ExpensesComponent },
    ],
  },
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' }, // Redireciona rotas não encontradas para a página inicial
];