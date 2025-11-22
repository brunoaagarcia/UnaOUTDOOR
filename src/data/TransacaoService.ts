import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { SUPABASE_CLIENT } from '../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleError } from '../lib/supabase/utils';
import type { BalancoMensalResult, Despesas, Receita } from './models';

@Injectable({ providedIn: 'root' })
export class TransacaoService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async createDespesa(data: Omit<Despesas, 'id' | 'created_at' | 'user_id'>): Promise<Despesas> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    if (authError || !user) {
      handleError(authError || new Error('User not authenticated'));
      throw authError || new Error('User not authenticated');
    }

    const despesaComUser = { ...data, user_id: user.id };

    const { data: despesa, error } = await this.supabase
      .from('despesas')
      .insert(despesaComUser)
      .select()
      .single();

    if (error) handleError(error);

    return despesa as Despesas;
  }

  async createReceita(data: Omit<Receita, 'id' | 'created_at' | 'user_id'>): Promise<Receita> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();
    if (authError || !user) {
      handleError(authError || new Error('User not authenticated'));
      throw authError || new Error('User not authenticated');
    }

    const receitaComUser = { ...data, user_id: user.id };

    const { data: receita, error } = await this.supabase
      .from('receita')
      .insert(receitaComUser)
      .select()
      .single();

    if (error) handleError(error);

    return receita as Receita;
  }

  async getBalancoMensal(mes: number, ano: number): Promise<BalancoMensalResult> {
  const { data, error } = await this.supabase.rpc('obter_balanco_mensal', { mes, ano });

    if (error) handleError(error);

    return data as BalancoMensalResult;
  }
}

