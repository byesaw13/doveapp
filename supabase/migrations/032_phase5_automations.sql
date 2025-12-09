-- Phase 5: AI Automations and History

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'estimate_followup',
    'invoice_followup',
    'job_closeout',
    'review_request',
    'lead_response'
  )),
  related_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  run_at TIMESTAMPTZ NOT NULL,
  last_attempt TIMESTAMPTZ NULL,
  attempts INTEGER DEFAULT 0,
  payload JSONB NULL,
  result JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  status TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scheduler performance and lookup
CREATE INDEX IF NOT EXISTS idx_automations_run_at ON automations (run_at);
CREATE INDEX IF NOT EXISTS idx_automations_related_id ON automations (related_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations (status);

-- Automation settings stored on business settings
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS ai_automation JSONB NOT NULL DEFAULT (
  '{
    "estimate_followups": true,
    "invoice_followups": true,
    "job_closeout": true,
    "review_requests": true,
    "lead_response": true
  }'
)::jsonb;
