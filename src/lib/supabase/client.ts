import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Padrão Singleton para garantir apenas uma instância do cliente
export const SUPABASE_CLIENT = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey
);

// Alias para compatibilidade caso usem 'supabase' diretamente em outros lugares
export const supabase = SUPABASE_CLIENT;