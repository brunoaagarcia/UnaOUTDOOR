import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SUPABASE_CLIENT } from '../../lib/supabase/client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  // Correção: Usa a instância única definida no client.ts em vez de recriar
  private supabase = SUPABASE_CLIENT;

  constructor() {}

  async signUpCliente(dadosCadastro: { email: string, password: string, nome: string, cpf: string, telefone: string }) {
    const { email, password, nome, cpf, telefone } = dadosCadastro;
    return this.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'cliente',
          nome: nome,
          cpf: cpf,
          telefone: telefone
        }
      }
    });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  customerLogin(email: string, password: string) {
    return new Observable<any>((observer) => {
      this.supabase.auth.signInWithPassword({
        email,
        password,
      }).then(({ data, error }) => {
        if (error) {
          observer.error(error);
        } else {
          this.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', data.user?.id)
            .single()
            .then(({ data: customerData, error: customerError }) => {
              if (customerError || !customerData) {
                observer.error(new Error('Usuário não é um cliente'));
              } else {
                observer.next(data);
              }
            });
        }
      });
    });
  }

  async logout() {
    const result = await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
    return result;
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  registerCustomer(name: string, email: string, password: string, phone: string): Observable<any> {
    return from(this.supabase.auth.signUp({ email, password })).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const user = data.user;
        return from(this.supabase
          .from('clientes')
          .insert([{ user_id: user?.id, name, email, phone }]));
      })
    );
  }

  getCurrentCustomer(): Observable<any> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error }) => {
        if (error) throw error;
        if (!user) throw new Error('Usuário não autenticado');
        return from(this.supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id)
          .single());
      }),
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  getCustomerOrders(): Observable<any> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error }) => {
        if (error) throw error;
        if (!user) throw new Error('Usuário não autenticado');
        return from(this.supabase
          .from('pedidos')
          .select(`*, items:item_pedido(*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }));
      }),
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  resetPassword(email: string): Observable<any> {
    return from(this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }));
  }

  updatePassword(newPassword: string): Observable<any> {
    return from(this.supabase.auth.updateUser({ password: newPassword }));
  }

  // FIX: Método adicionado para compatibilidade com o componente de recuperação de senha
  updatePasswordByCpf(cpf: string, newPassword: string): Observable<any> {
    // O Supabase usa a sessão ativa para atualizar a senha, o CPF é ignorado aqui
    // mas mantemos o parâmetro para não quebrar a chamada do componente.
    return this.updatePassword(newPassword);
  }
}