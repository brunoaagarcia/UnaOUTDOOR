import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from './order.service';
import { OrderStats } from './order.model';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  stats: OrderStats = {
    totalOrders: 0,
    pendingCount: 0,
    inProcessCount: 0,
    finishedCount: 0,
    totalValue: 0,
  };
  monthlyHistory: { year: number; month: number; stats: OrderStats }[] = [];
  isHistoryVisible = false;
  reportPeriodTitle = 'Relatório de Todo o Período';

  availableYears: number[] = [];
  selectedYear: number;
  selectedMonth: number;
  monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth();
  }

  ngOnInit(): void {
    this.orderService.refreshOrders().subscribe(() => {
      this.onDateChange();
      this.loadHistory();
    });

    // Subscribe to orders changes to update report automatically
    this.orderService.getOrders().subscribe(() => {
      this.onDateChange();
      this.loadHistory();
    });
  }

  loadHistory(): void {
    this.orderService.getMonthlyReportHistory().subscribe({
      next: (history) => {
        this.monthlyHistory = history;
        if (history.length > 0) {
          const years = new Set(history.map((h) => h.year));
          this.availableYears = Array.from(years).sort((a, b) => b - a);
          
          // Garante que o ano atual esteja na lista se não houver histórico
          if (!this.availableYears.includes(this.selectedYear)) {
            this.availableYears.unshift(this.selectedYear);
          }
        } else {
          this.availableYears = [this.selectedYear];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar histórico mensal', err),
    });
  }

  onDateChange(): void {
    const year = parseInt(this.selectedYear as any, 10);
    const month = parseInt(this.selectedMonth as any, 10);

    console.log('selectedMonth before parsing:', this.selectedMonth);

    console.log('onDateChange triggered with:', year, month);

    this.orderService.getStats(year, month).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.reportPeriodTitle = `Relatório de ${this.getMonthName(
          this.selectedMonth
        )}/${this.selectedYear}`;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar estatísticas', err),
    });
  }

  showAllTimeStats(): void {
    this.orderService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.reportPeriodTitle = 'Relatório de Todo o Período';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar estatísticas totais', err),
    });
  }

  getMonthName(monthIndex: number): string {
    return this.monthNames[monthIndex];
  }
}
