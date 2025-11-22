// Tipagens geradas para as tabelas do banco

export type CategoriaTipo = 'entrada' | 'saida';

export interface CategoriaFinanceira {
  id: number;
  user_id: string | null;
  nome: string;
  tipo: CategoriaTipo;
  created_at: Date | null;
}

export interface Empresa {
  id: number;
  user_id: string | null;
  razao_social: string;
  cnpj: string;
  telefone?: string | null;
  endereco?: string | null;
  created_at: Date | null;
}

export type ContratoStatus = 'Ativo' | 'Inativo' | 'Expirado' | string;

export interface Contrato {
  id: number;
  user_id: string | null;
  empresa_id: number;
  data_inicio: Date | null;
  data_fim: Date | null;
  valor_total: number;
  status: ContratoStatus;
  created_at: Date | null;
  // relacionais opcionais (quando fizer JOINs)
  empresa?: Empresa | null;
}

export interface Despesas {
  id: number;
  user_id: string | null;
  descricao: string;
  valor: number;
  data: Date | null;
  categoria_id: number | null;
  created_at: Date | null;
}

export interface Receita {
  id: number;
  user_id: string | null;
  descricao: string;
  valor: number;
  data: Date | null;
  contrato_id?: number | null;
  created_at: Date | null;
}

export interface BalancoMensalResult {
  mes: number;
  ano: number;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}
