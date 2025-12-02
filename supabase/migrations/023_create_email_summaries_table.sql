-- Create simplified email_summaries table for external monitoring
-- This replaces the complex emails_raw + email_insights system

CREATE TABLE IF NOT EXISTS email_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gmail identifiers
  gmail_id TEXT UNIQUE NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  
  -- Basic email info
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  snippet TEXT,
  
  -- AI-generated summary and categorization
  ai_summary TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  
  -- Action tracking
  action_required BOOLEAN DEFAULT false,
  action_type TEXT DEFAULT 'none',
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Extracted structured data
  extracted_data JSONB DEFAULT '{}'::jsonb,
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_summaries_gmail_id ON email_summaries(gmail_id);
CREATE INDEX IF NOT EXISTS idx_email_summaries_gmail_thread_id ON email_summaries(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_summaries_category ON email_summaries(category);
CREATE INDEX IF NOT EXISTS idx_email_summaries_priority ON email_summaries(priority);
CREATE INDEX IF NOT EXISTS idx_email_summaries_is_read ON email_summaries(is_read);
CREATE INDEX IF NOT EXISTS idx_email_summaries_received_at ON email_summaries(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_summaries_action_required ON email_summaries(action_required) WHERE action_required = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_email_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_summaries_updated_at
  BEFORE UPDATE ON email_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_email_summaries_updated_at();

-- Comments
COMMENT ON TABLE email_summaries IS 'Simplified email summaries received from external monitoring service';
COMMENT ON COLUMN email_summaries.gmail_id IS 'Gmail message ID';
COMMENT ON COLUMN email_summaries.gmail_thread_id IS 'Gmail thread ID for conversation grouping';
COMMENT ON COLUMN email_summaries.ai_summary IS 'AI-generated summary from OpenAI';
COMMENT ON COLUMN email_summaries.category IS 'Email category (LEAD_NEW, BILLING_*, SCHEDULING_*, etc.)';
COMMENT ON COLUMN email_summaries.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN email_summaries.action_required IS 'Whether this email requires action';
COMMENT ON COLUMN email_summaries.action_type IS 'Type of action needed';
COMMENT ON COLUMN email_summaries.action_items IS 'Array of specific action items';
COMMENT ON COLUMN email_summaries.extracted_data IS 'Structured data extracted by AI (leads, billing, etc.)';
