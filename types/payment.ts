export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Payment {
  id: string;
  job_id: string;
  amount: number;
  payment_method?: string | null;
  payment_date: string;
  notes?: string | null;
  square_payment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type PaymentUpdate = Partial<PaymentInsert>;
