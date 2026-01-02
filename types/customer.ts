export interface Customer {
  id: string;
  account_id?: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  source?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;
