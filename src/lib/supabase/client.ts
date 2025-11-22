import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Cliente Supabase para uso client-side (Angular).
 * Lê URL e anon key do arquivo de environment (`src/environments/environment.ts`).
 * Exporta um singleton `supabase` para ser usado por serviços e repositórios.
 *
 * Observação de segurança: somente use a ANON key (pública) no cliente.
 */
if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
  // Não lançar aqui para não quebrar builds; em runtime quem usar o cliente deve verificar.
  // Você deve preencher src/environments/environment.ts com supabaseUrl e supabaseAnonKey.
  // Console warning para ajudar o desenvolvedor.
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables não configuradas em src/environments/environment.ts');
}

export const supabase = createClient(environment.supabaseUrl || '', environment.supabaseAnonKey || '');

/**
 * Injection token para fornecer o cliente Supabase via DI Angular.
 */
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

