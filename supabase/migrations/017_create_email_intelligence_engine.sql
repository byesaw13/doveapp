-- Email Intelligence Engine v1
-- Migration: 017_create_email_intelligence_engine.sql

-- Create emails_raw table for storing raw email data
CREATE TABLE emails_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id TEXT NOT NULL,
  raw_data JSONB NOT NULL, -- Full Gmail API response
  processed_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_insights table for structured AI analysis results
CREATE TABLE email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_raw_id UUID REFERENCES emails_raw(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'LEAD_NEW',
    'LEAD_FOLLOWUP',
    'BILLING_INCOMING_INVOICE',
    'BILLING_OUTGOING_INVOICE',
    'BILLING_PAYMENT_RECEIVED',
    'BILLING_PAYMENT_ISSUE',
    'SCHEDULING_REQUEST',
    'SCHEDULING_CHANGE',
    'CUSTOMER_SUPPORT',
    'VENDOR_RECEIPT',
    'SYSTEM_SECURITY',
    'NEWSLETTER_PROMO',
    'SPAM_OTHER'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_action_required BOOLEAN NOT NULL DEFAULT false,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model_version TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table for actionable notifications
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_insight_id UUID REFERENCES email_insights(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lead', 'billing', 'scheduling', 'support', 'security')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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