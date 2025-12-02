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
  gmail_message_id: string;
  thread_id?: string;
  subject?: string;
  from_address?: string;
  to_addresses?: string;
  cc_addresses?: string;
  received_at?: string;
  snippet?: string;
  body_text?: string;
  body_html?: string;
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

export type ActionType =
  | 'respond_to_lead'
  | 'send_invoice'
  | 'review_invoice'
  | 'record_payment'
  | 'confirm_schedule'
  | 'reschedule'
  | 'resolve_issue'
  | 'file_for_records'
  | 'none';

export interface EmailInsight {
  id: string;
  email_id: string;
  category: EmailCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_action_required: boolean;
  action_type?: ActionType;
  summary?: string;
  notes?: string;
  details?: EmailInsightDetails;
  created_at: string;
}

export interface EmailInsightDetails {
  // For LEAD_*:
  lead?: {
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    job_type?: string | null;
    job_description?: string | null;
    urgency?: 'low' | 'medium' | 'high' | null;
    preferred_time_window?: string | null;
    lead_source?: string | null;
  };

  // For BILLING_*:
  billing?: {
    direction?: 'incoming' | 'outgoing' | null;
    amount?: number | null;
    currency?: string | null;
    invoice_number?: string | null;
    vendor_or_client_name?: string | null;
    due_date?: string | null; // ISO 8601 if possible
    paid_date?: string | null; // ISO 8601 if applicable
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed' | null;
  };

  // For SCHEDULING_*:
  scheduling?: {
    job_reference?: string | null;
    requested_dates?: string[] | null; // e.g. ["2025-12-03", "next Tuesday afternoon"]
    confirmed_date?: string | null;
    location_address?: string | null;
  };

  // For VENDOR_RECEIPT:
  vendor?: {
    vendor_name?: string | null;
    order_number?: string | null;
    total_amount?: number | null;
    currency?: string | null;
    items?: Array<{
      name: string;
      quantity?: number | null;
      unit_price?: number | null;
      category?: 'tool' | 'material' | 'consumable' | 'other' | null;
    }>;
    is_primarily_tools?: boolean | null;
    is_primarily_materials?: boolean | null;
  };

  // For SYSTEM_SECURITY:
  security?: {
    provider?: string | null;
    event_type?: string | null;
    severity?: 'low' | 'medium' | 'high' | 'critical' | null;
  };
}

export interface IntelligenceAlert {
  id: string;
  email_id: string;
  type: string; // e.g. 'lead', 'billing', 'scheduling', 'security'
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface IntelligenceLead {
  id: string;
  email_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  job_type?: string;
  job_description?: string;
  urgency?: string;
  preferred_time_window?: string;
  status: string;
  created_at: string;
}

export interface GmailConnection {
  id: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
