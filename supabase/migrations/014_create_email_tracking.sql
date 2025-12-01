-- Email tracking and review system
-- Migration: 014_create_email_tracking.sql

-- Create email_accounts table for storing Gmail account connections
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Will link to users table when authentication is added
  email_address TEXT NOT NULL UNIQUE,
  gmail_refresh_token TEXT, -- Encrypted refresh token for Gmail API
  gmail_access_token TEXT, -- Current access token (short-lived)
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_messages table for storing email data
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE, -- Gmail's unique message ID
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT,
  recipient TEXT,
  received_at TIMESTAMPTZ,
  body_text TEXT,
  body_html TEXT,
  has_attachments BOOLEAN DEFAULT false,
  labels TEXT[], -- Gmail labels
  category TEXT DEFAULT 'unreviewed' CHECK (category IN ('unreviewed', 'spending', 'billing', 'leads', 'other', 'ignored')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  extracted_data JSONB DEFAULT '{}', -- Parsed spending, billing, or lead data
  notes TEXT,
  reviewed_by UUID, -- User who reviewed this email
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_attachments table
CREATE TABLE email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  gmail_attachment_id TEXT,
  file_path TEXT, -- Local storage path if downloaded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spending_entries table for tracking expenses
CREATE TABLE spending_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  vendor TEXT,
  category TEXT, -- e.g., 'materials', 'equipment', 'services', 'travel'
  description TEXT,
  transaction_date DATE,
  payment_method TEXT, -- e.g., 'credit_card', 'check', 'wire_transfer'
  receipt_url TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_entries table for tracking invoices/receipts
CREATE TABLE billing_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  client_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table for tracking potential business
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_name TEXT,
  lead_source TEXT DEFAULT 'email',
  service_type TEXT, -- What service they're interested in
  estimated_value DECIMAL(10,2),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  notes TEXT,
  follow_up_date DATE,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_messages_account_id ON email_messages(email_account_id);
CREATE INDEX idx_email_messages_category ON email_messages(category);
CREATE INDEX idx_email_messages_received_at ON email_messages(received_at DESC);
CREATE INDEX idx_email_messages_gmail_message_id ON email_messages(gmail_message_id);

CREATE INDEX idx_spending_entries_transaction_date ON spending_entries(transaction_date DESC);
CREATE INDEX idx_spending_entries_category ON spending_entries(category);
CREATE INDEX idx_spending_entries_approved ON spending_entries(approved);

CREATE INDEX idx_billing_entries_client_id ON billing_entries(client_id);
CREATE INDEX idx_billing_entries_job_id ON billing_entries(job_id);
CREATE INDEX idx_billing_entries_status ON billing_entries(status);
CREATE INDEX idx_billing_entries_due_date ON billing_entries(due_date);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);

-- Add RLS policies
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on email_accounts" ON email_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_messages" ON email_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_attachments" ON email_attachments FOR ALL USING (true);
CREATE POLICY "Allow all operations on spending_entries" ON spending_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on billing_entries" ON billing_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);