// Estimate/Quote types
export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revised';

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string; // 'hour', 'sq ft', 'each', etc.
  total: number;
  tax_rate?: number;
  discount?: number;
}

export interface Estimate {
  id: string;
  estimate_number: string; // Auto-generated: EST-001

  // Related Records
  lead_id?: string;
  client_id?: string;
  property_id?: string;

  // Estimate Details
  title: string;
  description?: string;
  status: EstimateStatus;

  // Line Items
  line_items: EstimateLineItem[];

  // Pricing
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount?: number;
  total: number;

  // Terms
  valid_until: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  notes?: string;

  // Tracking
  sent_date?: string;
  viewed_date?: string;
  accepted_date?: string;
  declined_date?: string;
  decline_reason?: string;

  // Conversion
  converted_to_job_id?: string;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  service_type: string;
  default_line_items: EstimateLineItem[];
  default_terms?: string;
  default_payment_terms?: string;
  default_valid_days: number; // Days until expiration
  created_at: string;
  updated_at: string;
}

export interface EstimateStats {
  total_estimates: number;
  draft_estimates: number;
  sent_estimates: number;
  accepted_estimates: number;
  declined_estimates: number;
  acceptance_rate: number;
  total_value: number;
  accepted_value: number;
  average_estimate_value: number;
  average_time_to_acceptance: number;
  by_status: Record<EstimateStatus, number>;
}

export interface EstimateWithRelations extends Estimate {
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    phone: string;
  };
}
