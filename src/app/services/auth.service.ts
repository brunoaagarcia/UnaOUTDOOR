import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  createClient,
  SupabaseClient,
  Session,
  AuthChangeEvent,
  User,
} from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

/**
 * Serviço de autenticação usando Supabase Auth (client-side).
 * Injetar em componentes via constructor: constructor(private auth: AuthService) {}
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.supabaseAdmin = createClient(environment.supabaseUrl, environment.supabaseServiceRoleKey);
  }

  /**
   * Atualiza a senha de um usuário usando o CPF.
   * Este método requer privilégios de administrador (service_role).
   */
  async updatePasswordByCpf(cpf: string, newPassword: string) {
    // 1. Encontrar o user_id do cliente pelo CPF
    const { data: cliente, error: findError } = await this.supabaseAdmin
      .from('clientes')
      .select('user_id')
      .eq('cpf', cpf)
      .single();

    if (findError) {
      console.error('Erro ao buscar cliente pelo CPF:', findError);
      throw new Error('Cliente não encontrado ou erro na busca.');
    }

    if (!cliente) {
      throw new Error('Nenhum cliente encontrado com o CPF fornecido.');
    }

    const userId = cliente.user_id;

    // 2. Atualizar a senha do usuário usando o user_id
    const { data, error: updateError } = await this.supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao atualizar a senha do usuário:', updateError);
      throw new Error('Não foi possível atualizar a senha.');
    }

    return { data, error: null };
  }

  /**
   * Registra um NOVO CLIENTE.
   * Este método utiliza o Supabase Auth para criar o login do usuário (email/senha) 
   * e, crucialmente, anexa os dados do perfil (nome, cpf, telefone) 
   * dentro das 'options.data', junto com a flag 'role: cliente'.
   * O Trigger do banco de dados (Passo 4) usará esta 'role' para criar o perfil na tabela 'clientes'.
   */
  async signUpCliente(dadosCadastro: { email: string, password: string, nome: string, cpf: string, telefone: string }) {
    const { email, password, nome, cpf, telefone } = dadosCadastro;

    return this.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Metadados que serão gravados no auth.users e lidos pela nossa função SQL
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
   * Realiza login com email e senha (client-side, usa anon key).
   * Retorna a resposta do Supabase (data/error).
   */
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Realiza login de cliente com email e senha.
   * Retorna um Observable com o resultado da autenticação.
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
          // Verifica se o usuário é um cliente
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

  /**
   * Encerra a sessão do usuário.
   */
  async logout() {
    const result = await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
    return result;
  }

  /**
   * Recupera a sessão atual (se houver).
   */
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

  /**
   * Registra um cliente e tenta efetuar login automaticamente.
   * Retorna o resultado do login ou um erro.
   */
  registerAndLogin(name: string, email: string, password: string, phone: string): Observable<any> {
    // 1) faz signUp
    // 2) insere na tabela customers
    // 3) realiza signInWithPassword para garantir sessão ativa
    return from(this.supabase.auth.signUp({ email, password })).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;

        const userId = data.user?.id;

        // insere registro na tabela clientes
        return from(this.supabase
          .from('clientes')
          .insert([
            {
              user_id: userId,
              name,
              email,
              phone
            }
          ])).pipe(
            // depois de inserir, tenta logar para criar sessão
            switchMap(() => from(this.supabase.auth.signInWithPassword({ email, password })))
          );
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
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('customer_id', user.id)
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

  verifyResetCode(email: string, code: string): Observable<any> {
    return from(this.supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery'
    }));
  }

  updatePassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.verifyResetCode(email, code).pipe(
      switchMap(() => from(this.supabase.auth.updateUser({ password: newPassword })))
    );
  }
}
