-- Test the problematic migration syntax
DO $$
BEGIN
  -- Test if the issue is with inline CHECK constraints
  CREATE TABLE IF NOT EXISTS test_customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('call', 'email', 'note', 'meeting', 'sms', 'in_person', 'other')),
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound', 'internal')),
    subject TEXT,
    content TEXT,
    summary TEXT,
    contact_person VARCHAR(255),
    contact_method VARCHAR(100),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    requires_followup BOOLEAN DEFAULT false,
    followup_date TIMESTAMPTZ,
    followup_notes TEXT,
    tags TEXT[],
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    job_id UUID REFERENCES jobs(id),
    invoice_id UUID REFERENCES invoices(id)
  );

  RAISE NOTICE 'Table created successfully with inline CHECK constraints';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating table with inline CHECK constraints: %', SQLERRM;
END $$;