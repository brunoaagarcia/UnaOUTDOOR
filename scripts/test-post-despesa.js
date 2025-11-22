require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async function () {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltando SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const payload = {
    descricao: 'Despesa teste script',
    valor: 123.45,
    data: new Date().toISOString(),
    categoria_id: 1,
  };

  try {
    const { data, error } = await supabase.from('despesas').insert(payload).select().single();
    if (error) {
      console.error('Erro ao inserir:', error);
      process.exit(1);
    }
    console.log('Inserido com sucesso:', data);
    process.exit(0);
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
})();
