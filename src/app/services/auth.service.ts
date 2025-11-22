import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

/**
 * Serviço de autenticação usando Supabase Auth (client-side).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private supabase: SupabaseClient;

  // REMOVIDO: private supabaseAdmin (Não seguro no front-end)

  constructor() {
    // Apenas o cliente público (seguro)
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  /* REMOVIDO: updatePasswordByCpf 
     Motivo: Dependia da chave de serviço (admin) que removemos por segurança.
     Futuramente, isso deve ser feito via Supabase Edge Function.
  */

  /**
   * Registra um NOVO CLIENTE.
   */
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

  /**
   * Realiza login com email e senha.
   */
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Realiza login de cliente com verificação de tabela.
   */
  customerLogin(email: string, password: string) {
    return new Observable<any>((observer) => {
      this.supabase.auth.signInWithPassword({ 
        email, 
        password,
      }).then(({ data, error }) => {
        if (error) {
          observer.error(error);
        } else {
          // Verifica se o usuário é um cliente na tabela pública
          this.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', data.user?.id)
            .single()
            .then(({ data: customerData, error: customerError }) => {
              if (customerError || !customerData) {
                // Se logou no Auth mas não tem perfil de cliente
                observer.error(new Error('Usuário não é um cliente'));
              } else {
                observer.next(data);
              }
            });
        }
      });
    });
  }

  /**
   * Encerra a sessão do usuário.
   */
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
          .insert([
            {
              user_id: user?.id,
              name,
              email,
              phone
            }
          ]));
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
          .from('pedidos') // Ajustei para 'pedidos' (provável nome da sua tabela) se for 'orders' pode mudar
          .select(`
            *,
            items:item_pedido(*) 
          `) // Ajustei para item_pedido baseado no seu schema anterior
          .eq('user_id', user.id) // Ajustei para user_id (padrão do seu schema)
          .order('created_at', { ascending: false }));
      }),
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  // Métodos de recuperação de senha padrão (seguros)
  resetPassword(email: string): Observable<any> {
    return from(this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }));
  }

  updatePassword(newPassword: string): Observable<any> {
    return from(this.supabase.auth.updateUser({ password: newPassword }));
  }
}