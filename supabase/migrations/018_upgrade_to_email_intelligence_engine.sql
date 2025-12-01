-- Email Intelligence Engine v1 - Schema Migration
-- Migration: 018_upgrade_to_email_intelligence_engine.sql
-- This migration provides a clean transition from old email system to new intelligence engine
-- It drops ALL existing email-related tables and recreates them with the new schema
-- WARNING: This will delete all existing email data - backup if needed

-- Drop ALL email-related tables to ensure clean slate
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS email_enrichments CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS billing_events CASCADE;
DROP TABLE IF EXISTS billing_entries CASCADE;
DROP TABLE IF EXISTS spending_entries CASCADE;
DROP TABLE IF EXISTS email_attachments CASCADE;
DROP TABLE IF EXISTS email_messages CASCADE;
DROP TABLE IF EXISTS email_accounts CASCADE;
DROP TABLE IF EXISTS emails_raw CASCADE;
DROP TABLE IF EXISTS email_insights CASCADE;

-- Create new intelligence engine tables

-- Raw emails from Gmail
CREATE TABLE emails_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  subject TEXT,
  from_address TEXT,
  to_addresses TEXT,
  cc_addresses TEXT,
  received_at TIMESTAMPTZ,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structured analysis from OpenAI
CREATE TABLE email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails_raw(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  is_action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_type TEXT,
  summary TEXT,
  notes TEXT,
  details JSONB,        -- full "details" object from the model
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts for the app UI
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails_raw(id) ON DELETE SET NULL,
  type TEXT NOT NULL,         -- e.g. 'lead', 'billing', 'scheduling', 'security'
  priority TEXT NOT NULL,     -- 'low' | 'medium' | 'high' | 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'acknowledged' | 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Optional: leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails_raw(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  job_type TEXT,
  job_description TEXT,
  urgency TEXT,
  preferred_time_window TEXT,
  lead_source TEXT,
  status TEXT DEFAULT 'new',  -- 'new' | 'contacted' | 'scheduled' | 'lost' | 'won'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: billing events
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails_raw(id) ON DELETE SET NULL,
  direction TEXT,      -- 'incoming' | 'outgoing'
  amount NUMERIC(10,2),
  currency TEXT,
  invoice_number TEXT,
  vendor_or_client_name TEXT,
  due_date DATE,
  paid_date DATE,
  status TEXT,         -- 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_emails_raw_gmail_message_id ON emails_raw(gmail_message_id);
CREATE INDEX idx_emails_raw_received_at ON emails_raw(received_at DESC);
CREATE INDEX idx_email_insights_email_id ON email_insights(email_id);
CREATE INDEX idx_email_insights_category ON email_insights(category);
CREATE INDEX idx_email_insights_priority ON email_insights(priority);
CREATE INDEX idx_email_insights_is_action_required ON email_insights(is_action_required);
CREATE INDEX idx_alerts_email_id ON alerts(email_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_billing_events_due_date ON billing_events(due_date);

-- Enable RLS
ALTER TABLE emails_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on emails_raw" ON emails_raw FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_insights" ON email_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all operations on billing_events" ON billing_events FOR ALL USING (true);