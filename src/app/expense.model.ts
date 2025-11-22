export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: Date | string;
  createdAt: Date | string;
  user_id?: string;

  // ADIÇÕES PARA CORRIGIR OS 4 ERROS DE TIPO:
  categoria_id: string | null;
  contrato_id: string | null;

  // ADIÇÕES BÔNUS (seu service.ts também mapeia isso no GET):
  categoria_nome?: string;
  contrato_servico_nome?: string;
}