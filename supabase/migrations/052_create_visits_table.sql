-- Create visits table for scheduling
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visits_account_id ON visits(account_id);
CREATE INDEX idx_visits_job_id ON visits(job_id);
CREATE INDEX idx_visits_technician_id ON visits(technician_id);
CREATE INDEX idx_visits_start_at ON visits(start_at);
CREATE INDEX idx_visits_status ON visits(status);

-- RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view visits in their account" ON visits
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage visits in their account" ON visits
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND is_active = true
      AND role IN ('OWNER', 'ADMIN')
    )
  );