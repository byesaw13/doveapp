-- Create customer communications table for tracking all customer interactions
CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  communication_type VARCHAR(50) NOT NULL,

  -- Communication details
  direction VARCHAR(20),
  subject TEXT,
  content TEXT,
  summary TEXT, -- AI-generated or manual summary

  -- Contact information
  contact_person VARCHAR(255), -- Who at the customer was contacted
  contact_method VARCHAR(100), -- Phone number, email address used

  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER, -- For calls/meetings

  -- Status and priority
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'completed',

  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date TIMESTAMPTZ,
  followup_notes TEXT,

  -- Metadata
  tags TEXT[], -- Array of tags for categorization
  sentiment VARCHAR(20),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Related entities
  job_id UUID, -- Link to related job if applicable
  invoice_id UUID -- Link to related invoice if applicable
);

-- Add foreign key constraints
ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_job_id_fkey
FOREIGN KEY (job_id) REFERENCES jobs(id);

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES invoices(id);

-- Add CHECK constraints
ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_type_check
CHECK (communication_type IN ('call', 'email', 'note', 'meeting', 'sms', 'in_person', 'other'));

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_direction_check
CHECK (direction IN ('inbound', 'outbound', 'internal'));

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_priority_check
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_status_check
CHECK (status IN ('pending', 'completed', 'cancelled', 'failed'));

ALTER TABLE customer_communications
ADD CONSTRAINT customer_communications_sentiment_check
CHECK (sentiment IN ('positive', 'neutral', 'negative'));

-- Create indexes for performance
CREATE INDEX idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX idx_customer_communications_type ON customer_communications(communication_type);
CREATE INDEX idx_customer_communications_occurred_at ON customer_communications(occurred_at DESC);
CREATE INDEX idx_customer_communications_status ON customer_communications(status);
CREATE INDEX idx_customer_communications_requires_followup ON customer_communications(requires_followup) WHERE requires_followup = true;
CREATE INDEX idx_customer_communications_followup_date ON customer_communications(followup_date) WHERE followup_date IS NOT NULL;
CREATE INDEX idx_customer_communications_tags ON customer_communications USING GIN(tags);

-- Enable RLS
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified - allow all authenticated users)
CREATE POLICY "Users can view customer communications"
  ON customer_communications FOR SELECT USING (true);

CREATE POLICY "Users can create customer communications"
  ON customer_communications FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update customer communications"
  ON customer_communications FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete customer communications"
  ON customer_communications FOR DELETE USING (auth.uid() = created_by);

-- Update trigger
CREATE OR REPLACE FUNCTION update_customer_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_communications_updated_at
  BEFORE UPDATE ON customer_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_communications_updated_at();

-- Function to get customer communication summary
CREATE OR REPLACE FUNCTION get_customer_communication_summary(customer_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_communications INTEGER;
  last_contact TIMESTAMPTZ;
  avg_response_time INTERVAL;
  sentiment_distribution JSONB;
  communication_types JSONB;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_communications
  FROM customer_communications
  WHERE customer_id = customer_uuid;

  -- Get last contact
  SELECT MAX(occurred_at) INTO last_contact
  FROM customer_communications
  WHERE customer_id = customer_uuid;

  -- Get sentiment distribution
  SELECT jsonb_object_agg(sentiment, count) INTO sentiment_distribution
  FROM (
    SELECT sentiment, COUNT(*) as count
    FROM customer_communications
    WHERE customer_id = customer_uuid AND sentiment IS NOT NULL
    GROUP BY sentiment
  ) s;

  -- Get communication types distribution
  SELECT jsonb_object_agg(communication_type, count) INTO communication_types
  FROM (
    SELECT communication_type, COUNT(*) as count
    FROM customer_communications
    WHERE customer_id = customer_uuid
    GROUP BY communication_type
  ) t;

  result := jsonb_build_object(
    'total_communications', total_communications,
    'last_contact', last_contact,
    'sentiment_distribution', COALESCE(sentiment_distribution, '{}'::jsonb),
    'communication_types', COALESCE(communication_types, '{}'::jsonb),
    'pending_followups', (
      SELECT COUNT(*) FROM customer_communications
      WHERE customer_id = customer_uuid
      AND requires_followup = true
      AND (followup_date IS NULL OR followup_date > NOW())
    ),
    'overdue_followups', (
      SELECT COUNT(*) FROM customer_communications
      WHERE customer_id = customer_uuid
      AND requires_followup = true
      AND followup_date < NOW()
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;