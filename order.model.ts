export interface Order {
  displayId?: number;
  formattedDisplayId?: string;
  id: string; // Alterado para string para corresponder ao UUID do Supabase
  createdAt?: string;
  userId?: string;
  customerName: string;
  customerDocument: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName: string;
  totalPrice: number;
  status: string; // Alterado para string para maior flexibilidade
  orderDate?: string; // Alterado para string e opcional
  height?: number;
  width?: number;
  length?: number;
  description?: string;
  customerId?: string;
  pago?: boolean;
  formaPagamento?: 'À vista' | 'Parcelado';
  installments?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingCount: number;
  inProcessCount: number;
  finishedCount: number;
  totalValue: number;
}