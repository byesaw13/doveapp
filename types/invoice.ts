// Invoice and Payment types

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void';

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'card'
  | 'online'
  | 'bank_transfer'
  | 'other';

export interface Invoice {
  id: string;
  job_id: string;
  estimate_id?: string | null;
  customer_id?: string | null;
  status: InvoiceStatus;
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  subtotal: number;
  total: number;
  balance_due: number;
  notes?: string | null;
  client_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  service_id?: number | null;
  description: string;
  quantity: number;
  tier?: string | null;
  unit_price: number;
  line_total: number;
  created_at: string;
}

// Invoice payment (separate from job payments)
export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paid_at: string;
  notes?: string | null;
  created_at: string;
}

// Deprecated: Use InvoicePayment instead
export type Payment = InvoicePayment;

export interface InvoiceWithRelations extends Invoice {
  job?: {
    id: string;
    job_number: string;
    title: string;
    status: string;
  };
  estimate?: {
    id: string;
    estimate_number: string;
    title: string;
  };
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  invoice_line_items: InvoiceLineItem[];
  invoice_payments: InvoicePayment[];
}

export interface InvoiceStats {
  total_invoices: number;
  draft_invoices: number;
  sent_invoices: number;
  paid_invoices: number;
  total_revenue: number;
  outstanding_balance: number;
}
