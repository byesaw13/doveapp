export interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLeadDetails {
  id: string;
  email_id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  service_type?: string;
  urgency: 'low' | 'normal' | 'high' | 'emergency';
  preferred_dates?: any;
  budget_hint?: string;
  source_channel?: string;
  has_photos: boolean;
  parsed_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface BillingEvent {
  id: string;
  email_id: string;
  contact_id?: string;
  job_id?: string;
  billing_type:
    | 'customer_invoice'
    | 'customer_payment'
    | 'customer_refund'
    | 'vendor_bill'
    | 'vendor_payment'
    | 'tax_notice'
    | 'subscription_charge';
  direction: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  invoice_number?: string;
  reference?: string;
  due_date?: string;
  paid_at?: string;
  vendor_name?: string;
  payer_name?: string;
  status: 'open' | 'paid' | 'overdue' | 'cancelled' | 'info_only';
  parsed_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  type:
    | 'new_lead'
    | 'lead_no_reply'
    | 'invoice_due'
    | 'invoice_overdue'
    | 'payment_failed'
    | 'large_vendor_bill'
    | 'system_notification';
  severity: 'low' | 'medium' | 'high';
  email_id?: string;
  contact_id?: string;
  job_id?: string;
  title: string;
  message: string;
  created_at: string;
  due_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

// Email Intelligence Engine Types
export interface EmailRaw {
  id: string;
  email_account_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  raw_data: any; // Full Gmail API response
  processed_at?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
}

export type EmailCategory =
  | 'LEAD_NEW'
  | 'LEAD_FOLLOWUP'
  | 'BILLING_INCOMING_INVOICE'
  | 'BILLING_OUTGOING_INVOICE'
  | 'BILLING_PAYMENT_RECEIVED'
  | 'BILLING_PAYMENT_ISSUE'
  | 'SCHEDULING_REQUEST'
  | 'SCHEDULING_CHANGE'
  | 'CUSTOMER_SUPPORT'
  | 'VENDOR_RECEIPT'
  | 'SYSTEM_SECURITY'
  | 'NEWSLETTER_PROMO'
  | 'SPAM_OTHER';

export interface EmailInsight {
  id: string;
  email_raw_id: string;
  category: EmailCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_action_required: boolean;
  summary: string;
  details: EmailInsightDetails;
  confidence_score?: number;
  ai_model_version?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface EmailInsightDetails {
  // Lead details
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  job_type?: string;
  job_description?: string;
  urgency?: 'low' | 'normal' | 'high' | 'emergency';
  preferred_time_window?: string;
  budget_range?: string;

  // Billing details
  direction?: 'incoming' | 'outgoing';
  amount?: number;
  currency?: string;
  invoice_number?: string;
  due_date?: string;
  status?: 'open' | 'paid' | 'overdue' | 'cancelled';

  // Scheduling details
  requested_dates?: string[];
  confirmed_date?: string;
  location?: string;
  job_reference?: string;

  // Vendor receipt details
  vendor_name?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
    category: 'materials' | 'tools' | 'equipment' | 'services';
  }>;
  total_amount?: number;
  tools_breakdown?: number;
  materials_breakdown?: number;

  // General details
  key_topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  response_deadline?: string;
  follow_up_date?: string;
}

export interface IntelligenceAlert {
  id: string;
  email_insight_id: string;
  type: 'lead' | 'billing' | 'scheduling' | 'support' | 'security';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  due_at?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}
