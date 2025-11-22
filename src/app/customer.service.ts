import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase } from '../lib/supabase/client';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Define a interface para o modelo de Cliente para garantir a tipagem.
export interface Cliente {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  // Adicione outros campos conforme necessário
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private supabase = supabase;

  constructor() {}

  /**
   * Retorna uma lista de todos os clientes.
   * A segurança é garantida pelas Row Level Security (RLS) policies no Supabase.
   */
  getClientes(): Observable<Cliente[]> {
    return from(
      this.supabase
        .from('clientes') // A tabela é 'clientes'
        .select('*')
        .order('nome', { ascending: true })
    ).pipe(
      map((response: PostgrestSingleResponse<Cliente[]>) => {
        if (response.error) {
          throw response.error;
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Atualiza o perfil de um cliente específico.
   * @param id O ID do cliente a ser atualizado.
   * @param dados Um objeto com os campos a serem atualizados.
   */
  updateClienteProfile(id: number, dados: Partial<Cliente>): Observable<Cliente> {
    return from(
      this.supabase
        .from('clientes')
        .update(dados)
        .eq('id', id)
        .select()
        .single() // Retorna o objeto atualizado
    ).pipe(
      map((response: PostgrestSingleResponse<Cliente>) => {
        if (response.error) {
          throw response.error;
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Supabase error:', error);
    return throwError(() => new Error('Ocorreu um erro na comunicação com o banco de dados.'));
  }
}
