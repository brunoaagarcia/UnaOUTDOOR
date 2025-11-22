import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Expense } from './expense.model'; // Assumindo que 'Expense' tem as propriedades corretas (amount, description, etc.)
import { supabase } from '../lib/supabase/client';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private supabase = supabase;

  constructor() {}

 getExpenses(): Observable<Expense[]> {
    return from(
      this.supabase
        .from('despesas')
        // CORREÇÃO: Trocamos 'servico_nome' por 'descricao' na FK do contrato
        .select(
          'id, created_at, data_despesa, categoria_id, contrato_id, valor, descricao, categoria_financeira(nome), contrato:contrato_id(id, descricao)' // <-- MUDANÇA AQUI
        )
        .order('id', { ascending: false })
    ).pipe(
      map((response: PostgrestSingleResponse<any[]>) => {
        if (response.error) {
          console.error('Supabase error (getExpenses):', response.error);
          throw response.error;
        }
        
        return (response.data || []).map((dbExpense) => ({
          id: dbExpense.id,
          description: dbExpense.descricao, 
          amount: dbExpense.valor, 
          date: new Date(dbExpense.data_despesa),
          createdAt: new Date(dbExpense.created_at),
          categoria_id: dbExpense.categoria_id,
          categoria_nome: dbExpense.categoria_financeira?.nome, 
          contrato_id: dbExpense.contrato_id,
          // CORREÇÃO: Mapeando 'dbExpense.contrato?.descricao'
          contrato_servico_nome: dbExpense.contrato?.descricao, // <-- MUDANÇA AQUI
        } as Expense));
      }),
      catchError(this.handleError)
    );
  }
  

  addExpense(expense: Expense): Observable<Expense> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error }) => {
        if (error || !user) {
          return throwError(
            () => new Error('Authentication error: User not found.')
          );
        }

        const payload = {
          descricao: expense.description,
          valor: expense.amount,

          // CORREÇÃO (Bug 'Invalid time value'):
          // Verifica se expense.date é um valor válido (não nulo ou "")
          // Se for inválido, envia null (a DB usará o default 'now()')
          data_despesa: expense.date ? new Date(expense.date).toISOString() : null,

          user_id: user.id,
          contrato_id:
            expense.contrato_id === '' || !expense.contrato_id ? null : expense.contrato_id,
          categoria_id:
            expense.categoria_id === '' || !expense.categoria_id ? null : expense.categoria_id,
        };

        return from(
          this.supabase
            .from('despesas')
            .insert([payload])
            .select()
            .single()
        ).pipe(
          map((response: PostgrestSingleResponse<Expense>) => {
            if (response.error) {
              throw response.error;
            }
            return response.data;
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  updateExpense(updatedExpense: Expense): Observable<Expense> {
    const payload = {
      descricao: updatedExpense.description,
      valor: updatedExpense.amount,

      // CORREÇÃO (Bug 'Invalid time value'):
      // Mesma verificação aqui
      data_despesa: updatedExpense.date ? new Date(updatedExpense.date).toISOString() : null,

      contrato_id:
        updatedExpense.contrato_id === '' || !updatedExpense.contrato_id ? null : updatedExpense.contrato_id,
      categoria_id:
        updatedExpense.categoria_id === '' || !updatedExpense.categoria_id ? null : updatedExpense.categoria_id,
    };

    return from(
      this.supabase
        .from('despesas')
        .update(payload)
        .eq('id', updatedExpense.id)
        .select()
        .single()
    ).pipe(
      map((response: PostgrestSingleResponse<Expense>) => {
        if (response.error) {
          throw response.error;
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  deleteExpense(id: number): Observable<null> {
    return from(this.supabase.from('despesas').delete().eq('id', id)).pipe(
      map((response: PostgrestSingleResponse<null>) => {
        if (response.error) {
          throw response.error;
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  // Bug #4 (Seu código já estava correto)
  private handleError(error: any) {
    console.error('Supabase error:', error);
    return throwError(
      () =>
        new Error(
          'Ocorreu um erro na comunicação com o banco de dados.'
        )
    );
  }
}