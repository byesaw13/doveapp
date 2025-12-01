-- Email Intelligence Engine v1
-- Migration: 017_create_email_intelligence_engine.sql

-- Raw emails table
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
  status TEXT DEFAULT 'new',
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

-- Enable RLS
ALTER TABLE emails_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on emails_raw" ON emails_raw FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_insights" ON email_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_emails_raw_account_id ON emails_raw(email_account_id);
CREATE INDEX idx_emails_raw_gmail_message_id ON emails_raw(gmail_message_id);
CREATE INDEX idx_emails_raw_processing_status ON emails_raw(processing_status);
CREATE INDEX idx_emails_raw_created_at ON emails_raw(created_at DESC);

CREATE INDEX idx_email_insights_email_raw_id ON email_insights(email_raw_id);
CREATE INDEX idx_email_insights_category ON email_insights(category);
CREATE INDEX idx_email_insights_priority ON email_insights(priority);
CREATE INDEX idx_email_insights_is_action_required ON email_insights(is_action_required);
CREATE INDEX idx_email_insights_created_at ON email_insights(created_at DESC);

CREATE INDEX idx_alerts_email_insight_id ON alerts(email_insight_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_due_at ON alerts(due_at);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Enable RLS
ALTER TABLE emails_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on emails_raw" ON emails_raw FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_insights" ON email_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);