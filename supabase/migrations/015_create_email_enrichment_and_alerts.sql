-- Email enrichment and alerts system
-- Migration: 015_create_email_enrichment_and_alerts.sql

-- Create email_lead_details table for detailed lead information
CREATE TABLE email_lead_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  service_type TEXT, -- e.g. 'interior_paint', 'handyman_general', 'tile', 'deck', 'maintenance_plan'
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'emergency')),
  preferred_dates JSONB, -- Array of preferred date strings or date ranges
  budget_hint TEXT, -- Numeric if obvious, or text description
  source_channel TEXT, -- e.g. 'direct_email', 'website_form', 'referral'
  has_photos BOOLEAN DEFAULT false,
  parsed_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (parsed_confidence >= 0.0 AND parsed_confidence <= 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_events table for comprehensive billing tracking
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  billing_type TEXT NOT NULL CHECK (billing_type IN (
    'customer_invoice', 'customer_payment', 'customer_refund',
    'vendor_bill', 'vendor_payment', 'tax_notice', 'subscription_charge'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  invoice_number TEXT,
  reference TEXT, -- Additional reference number
  due_date DATE,
  paid_at TIMESTAMPTZ,
  vendor_name TEXT, -- For vendor bills
  payer_name TEXT, -- For customer payments
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled', 'info_only')),
  parsed_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (parsed_confidence >= 0.0 AND parsed_confidence <= 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table for notifications and smart queues
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'new_lead', 'lead_no_reply', 'invoice_due', 'invoice_overdue',
    'payment_failed', 'large_vendor_bill', 'system_notification'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  email_id UUID REFERENCES email_messages(id),
  contact_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ, -- For time-sensitive alerts
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Add requires_reply flag to email_messages
ALTER TABLE email_messages ADD COLUMN requires_reply BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_email_lead_details_email_id ON email_lead_details(email_id);
CREATE INDEX idx_email_lead_details_service_type ON email_lead_details(service_type);
CREATE INDEX idx_email_lead_details_urgency ON email_lead_details(urgency);

CREATE INDEX idx_billing_events_email_id ON billing_events(email_id);
CREATE INDEX idx_billing_events_contact_id ON billing_events(contact_id);
CREATE INDEX idx_billing_events_job_id ON billing_events(job_id);
CREATE INDEX idx_billing_events_billing_type ON billing_events(billing_type);
CREATE INDEX idx_billing_events_status ON billing_events(status);
CREATE INDEX idx_billing_events_due_date ON billing_events(due_date);

CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_email_id ON alerts(email_id);
CREATE INDEX idx_alerts_contact_id ON alerts(contact_id);
CREATE INDEX idx_alerts_job_id ON alerts(job_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_due_at ON alerts(due_at);

CREATE INDEX idx_email_messages_requires_reply ON email_messages(requires_reply);

-- Add RLS policies
ALTER TABLE email_lead_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on email_lead_details" ON email_lead_details FOR ALL USING (true);
CREATE POLICY "Allow all operations on billing_events" ON billing_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);