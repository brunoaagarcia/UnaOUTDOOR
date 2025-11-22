import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, ReplaySubject, throwError } from 'rxjs';
import { map, catchError, switchMap, tap, take } from 'rxjs/operators';
import { Order, OrderStats } from './order.model';
import { supabase } from './src/lib/supabase/client';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private supabase = supabase;
  private orders$ = new ReplaySubject<Order[]>(1);

  constructor() {
    this.refreshOrders().subscribe(); // Garante que os pedidos sejam carregados na inicialização
  }

  private fetchOrders(): Observable<Order[]> {
    return from(
      this.supabase
        .from('pedidos')
        .select('*')
        .order('id', { ascending: false })
    ).pipe(
      map((response: PostgrestSingleResponse<any[]>) => {
        if (response.error) {
          console.error('Supabase response error (getOrders):', response);
          throw response.error;
        }
        return (response.data || []).map(
          (dbOrder: any) =>
            ({
              id: dbOrder.id,
              createdAt: dbOrder.created_at,
              userId: dbOrder.user_id,
              customerName: dbOrder.cliente_nome,
              customerDocument: dbOrder.cliente_cpf,
              customerPhone: dbOrder.cliente_telefone,
              customerEmail: dbOrder.cliente_email,
              serviceName: dbOrder.servico_nome,
              totalPrice: dbOrder.valor_total,
              height: dbOrder.altura,
              width: dbOrder.largura,
              length: dbOrder.comprimento,
              description: dbOrder.descricao,
            	status: dbOrder.status,
            	customerId: dbOrder.cliente_id,
            	orderDate: dbOrder.data_pedido,
            	pago: dbOrder.pago,
            	formaPagamento: dbOrder.forma_pagamento,
            } as Order)
        );
      }),
      tap(orders => this.orders$.next(orders)), // Atualiza o ReplaySubject
      catchError(this.handleError)
    );
  }

  refreshOrders(): Observable<Order[]> {
    return this.fetchOrders();
  }

  getOrders(): Observable<Order[]> {
    return this.orders$.asObservable();
  }

  // Os métodos de estatísticas agora precisam buscar os dados primeiro
  getStats(year?: number, month?: number): Observable<OrderStats> {
    return this.getOrders().pipe(
      take(1), // Garante que estamos pegando o valor mais recente e que o pipe completa
      map(orders => {
        console.log('Orders before filter:', orders);
        let filteredOrders = orders;

        if (year !== undefined && month !== undefined) {
          filteredOrders = orders.filter(order => {
            // Garante que orderDate não seja undefined antes de criar o objeto Date
            if (!order.orderDate) return false;

            const orderDate = new Date(order.orderDate);
            return orderDate.getFullYear() === year && orderDate.getMonth() === month;
          });
        }

        const totalOrders = filteredOrders.length;
        const pendingCount = filteredOrders.filter(o => o.status === 'Pendente').length;
        const inProcessCount = filteredOrders.filter(o => o.status === 'Em Processo').length;
        const finishedCount = filteredOrders.filter(o => o.status === 'Finalizado').length;
        const totalValue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        return { totalOrders, pendingCount, inProcessCount, finishedCount, totalValue };
      })
    );
  }

  getMonthlyReportHistory(): Observable<{ year: number; month: number; stats: OrderStats }[]> {
    return this.getOrders().pipe(
      map(orders => {
        const history: { [key: string]: Order[] } = {};

        orders.forEach(order => {
          if (!order.orderDate) return;

          const orderDate = new Date(order.orderDate);
          const year = orderDate.getFullYear();
          const month = orderDate.getMonth();
          const key = `${year}-${month}`;

          if (!history[key]) {
            history[key] = [];
          }
          history[key].push(order);
        });

        const monthlyReports = Object.keys(history).map(key => {
          const [yearStr, monthStr] = key.split('-');
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const monthlyOrders = history[key];

          const totalOrders = monthlyOrders.length;
          const pendingCount = monthlyOrders.filter(o => o.status === 'Pendente').length;
          const inProcessCount = monthlyOrders.filter(o => o.status === 'Em Processo').length;
          const finishedCount = monthlyOrders.filter(o => o.status === 'Finalizado').length;
          const totalValue = monthlyOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

          const stats: OrderStats = { totalOrders, pendingCount, inProcessCount, finishedCount, totalValue };
          return { year, month, stats };
        });

        return monthlyReports.sort((a, b) => b.year - a.year || b.month - a.month);
      })
    );
  }

  addOrder(newOrder: Partial<Order>): Observable<Order> {
    // Mapeamento explícito do modelo do frontend (camelCase) para o banco de dados (snake_case)
    const payload = {
      cliente_nome: newOrder.customerName,
      cliente_cpf: newOrder.customerDocument,
      cliente_telefone: newOrder.customerPhone,
      cliente_email: newOrder.customerEmail,
      servico_nome: newOrder.serviceName, // Mapeado de serviceName
      valor_total: newOrder.totalPrice || 0, // Garante que valor_total não seja nulo
      altura: newOrder.height,
      largura: newOrder.width,
      comprimento: newOrder.length,
      descricao: newOrder.description,
      
      // === A CORREÇÃO (Bug 23502) ===
      // O formulário de Orçamento (Cliente) não envia 'status' ou 'pago'.
      // O backup do código antigo envia 'undefined', que o Supabase lê como 'null'.
      // 'null' viola a regra NOT-NULL.
      // FORÇAMOS o valor padrão aqui para garantir que o INSERT funcione.

      status: newOrder.status || 'Pendente', // Força 'Pendente' (Default Value da DB)
      pago: newOrder.pago || false, // Força 'false' (Default Value da DB)
      // A coluna forma_pagamento é 'nullable', então 'null' é aceitável
      forma_pagamento: newOrder.formaPagamento || null, 
    };
    
    console.debug('Supabase insert payload (addOrder):', payload);

    return from(
      this.supabase
        .from('pedidos')
        .insert([payload])
        .select()
        .single()
    ).pipe(
      map((response: PostgrestSingleResponse<Order>) => {
        if (response.error) {
          console.error('Supabase response error (addOrder):', response);
          throw response.error;
        }
        this.refreshOrders().subscribe(); // Atualiza o cache de pedidos
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  updateOrder(updatedOrder: Order): Observable<Order> {
    // Mapeamento explícito do modelo do frontend (camelCase) para o banco de dados (snake_case)
    const payload = {
      cliente_nome: updatedOrder.customerName,
      cliente_cpf: updatedOrder.customerDocument,
      cliente_telefone: updatedOrder.customerPhone,
      cliente_email: updatedOrder.customerEmail,
      servico_nome: updatedOrder.serviceName, // Mapeado de serviceName
      valor_total: updatedOrder.totalPrice,
      altura: updatedOrder.height,
      largura: updatedOrder.width,
      comprimento: updatedOrder.length,
      descricao: updatedOrder.description,
      status: updatedOrder.status,
      pago: updatedOrder.pago,
      forma_pagamento: updatedOrder.formaPagamento,
    };

    console.debug('Supabase update payload (updateOrder):', payload);

    return from(
      this.supabase
        .from('pedidos')
        .update(payload)
        .eq('id', updatedOrder.id)
        .select()
        .single()
    ).pipe(
      map((response: PostgrestSingleResponse<Order>) => {
      	if (response.error) {
        	console.error('Supabase response error (updateOrder):', response);
        	throw response.error;
      	}
        this.refreshOrders().subscribe(); // Atualiza o cache de pedidos
      	return response.data;
    	}),
    	catchError(this.handleError)
  	);
  }

  deleteOrder(id: string): Observable<null> {
    return from(
      this.supabase
        .from('pedidos')
        .delete()
        .eq('id', id)
  	).pipe(
    	map((response: PostgrestSingleResponse<null>) => {
      	if (response.error) {
      		console.error('Supabase response error (deleteOrder):', response);
      		throw response.error;
      	}
        this.refreshOrders().subscribe(); // Atualiza o cache de pedidos
      	return response.data;
    	}),
    	catchError(this.handleError)
  	);
  }

  private handleError(error: any) {
    console.error('Supabase error:', error.message); // Loga a mensagem de erro específica
    return throwError(() => new Error('Ocorreu um erro na comunicação com o banco de dados.'));
  }
}