import { PostgrestError } from '@supabase/supabase-js';

/**
 * Normaliza erros retornados pelo Supabase (PostgrestError) ou erros genéricos
 * e lança um Error com mensagem mais legível.
 */
export function handleError(error: PostgrestError | Error | null | undefined): never | void {
  if (!error) return;

  // PostgrestError tem campos message, code, details, hint
  if ((error as PostgrestError).message) {
    const e = error as PostgrestError;
    const parts: string[] = [];
    if (e.message) parts.push(e.message);
    if (e.details) parts.push(`details: ${e.details}`);
    if (e.hint) parts.push(`hint: ${e.hint}`);
    if (e.code) parts.push(`code: ${e.code}`);

    throw new Error(parts.join(' | '));
  }

  // Erro genérico
  throw new Error(error.message || String(error));
}
