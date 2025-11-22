import { supabase } from '../lib/supabase/client';
import { handleError } from '../lib/supabase/utils';
import type { Contrato } from './models';

/**
 * Repositório para operações relacionadas a contratos.
 * O construtor aceita um SupabaseClient opcional para facilitar testes; caso não seja
 * fornecido, createServerClient() será usado internamente.
 */
export class ContratoRepository {
  // Usa o singleton `supabase` importado do client
  constructor() {}

  /**
   * Retorna contratos ativos do usuário atual ordenados por data_fim asc
   * incluindo a razao_social da empresa associada.
   */
  async getContratosProximosDoFim(userId: string): Promise<Array<Contrato & { empresa_razao_social?: string }>> {
    try {
      const { data, error } = await supabase
        .from('contrato')
        .select('*, empresa:empresa(razao_social)')
        .eq('user_id', userId)
        .eq('status', 'Ativo')
        .order('data_fim', { ascending: true });

      if (error) handleError(error);

      // mapear para incluir empresa_razao_social no topo do objeto para conveniência
      const mapped = (data || []).map((row: any) => {
        const empresa_razao_social = row.empresa?.razao_social ?? undefined;
        const contrato: Contrato = {
          id: row.id,
          user_id: row.user_id ?? null,
          empresa_id: row.empresa_id,
          data_inicio: row.data_inicio ? new Date(row.data_inicio) : null,
          data_fim: row.data_fim ? new Date(row.data_fim) : null,
          valor_total: Number(row.valor_total),
          status: row.status,
          created_at: row.created_at ? new Date(row.created_at) : null,
        };

        return Object.assign(contrato, { empresa_razao_social });
      });

      return mapped;
    } catch (err) {
      handleError(err as any);
      return [];
    }
  }
}

