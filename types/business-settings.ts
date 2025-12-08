export interface BusinessSettings {
  id: string;
  company_name: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_zip?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  logo_url?: string;
  default_estimate_validity_days: number;
  default_tax_rate: number;
  default_payment_terms: string;
  default_estimate_terms: string;
  default_invoice_terms: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettingsUpdate {
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_zip?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  logo_url?: string;
  default_estimate_validity_days?: number;
  default_tax_rate?: number;
  default_payment_terms?: string;
  default_estimate_terms?: string;
  default_invoice_terms?: string;
}
