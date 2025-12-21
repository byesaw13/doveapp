export type JobStatus =
  | 'draft'
  | 'quote'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'cancelled';

export type LineItemType = 'labor' | 'material';

export interface JobLineItem {
  id: string;
  job_id: string;
  item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  service_id?: number;
  tier?: string;
  line_total?: number;
  created_at: string;
}

export interface Job {
  id: string;
  account_id?: string;
  client_id: string;
  property_id?: string | null;
  estimate_id?: string | null;
  job_number: string;
  title: string;
  description?: string | null;
  status: JobStatus;
  service_date?: string | null;
  scheduled_time?: string | null;
  scheduled_for?: string | null;
  technician_id?: string | null;
  assigned_tech_id?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  notes?: string | null;
  internal_notes?: string | null;
  client_notes?: string | null;
  ready_for_invoice?: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobWithClient extends Job {
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface JobWithDetails extends Job {
  line_items: JobLineItem[];
  client: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address_line1?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  };
}

export type JobInsert = Omit<
  Job,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'job_number'
  | 'payment_status'
  | 'amount_paid'
>;
export type JobUpdate = Partial<JobInsert>;

export type LineItemInsert = Omit<JobLineItem, 'id' | 'created_at' | 'total'>;
