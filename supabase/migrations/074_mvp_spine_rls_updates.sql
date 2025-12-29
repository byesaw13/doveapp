-- MVP Spine RLS Updates Migration
-- Adds account_id to properties and job_notes for strict org scoping
-- Updates RLS policies for MVP Spine security requirements

-- Add account_id to properties if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'account_id') THEN
        ALTER TABLE properties ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add account_id to job_notes if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_notes' AND column_name = 'account_id') THEN
        ALTER TABLE job_notes ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Backfill account_id for properties from client (customer) account_id
UPDATE properties
SET account_id = customers.account_id
FROM customers
WHERE properties.client_id = customers.id AND properties.account_id IS NULL;

-- Backfill account_id for job_notes from jobs account_id
UPDATE job_notes
SET account_id = jobs.account_id
FROM jobs
WHERE job_notes.job_id = jobs.id AND job_notes.account_id IS NULL;

-- Drop existing policies for properties
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Staff can manage properties" ON properties;

-- New strict policies for properties
CREATE POLICY "Account members can view properties"
  ON properties
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage properties"
  ON properties
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
      AND is_active = true
    )
  );

-- Drop existing policies for jobs
DROP POLICY IF EXISTS "Account members can view jobs" ON jobs;
DROP POLICY IF EXISTS "Staff can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can manage jobs" ON jobs;

-- New strict policies for jobs
CREATE POLICY "Account members can view jobs"
  ON jobs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage jobs"
  ON jobs
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
      AND is_active = true
    )
  );

CREATE POLICY "Techs can view assigned jobs"
  ON jobs
  FOR SELECT
  USING (
    assigned_tech_id = auth.uid() AND
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND role = 'TECH' AND is_active = true
    )
  );

CREATE POLICY "Techs can update status on assigned jobs"
  ON jobs
  FOR UPDATE
  USING (
    assigned_tech_id = auth.uid() AND
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND role = 'TECH' AND is_active = true
    )
  )
  WITH CHECK (
    assigned_tech_id = auth.uid() AND
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND role = 'TECH' AND is_active = true
    )
  );

-- Drop existing policies for job_notes
DROP POLICY IF EXISTS "Technicians can manage their own notes" ON job_notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON job_notes;

-- New policies for job_notes
CREATE POLICY "Account members can view job notes"
  ON job_notes
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Techs can insert notes on assigned jobs"
  ON job_notes
  FOR INSERT
  WITH CHECK (
    technician_id = auth.uid() AND
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid() AND role = 'TECH' AND is_active = true
    ) AND
    job_id IN (
      SELECT id FROM jobs WHERE assigned_tech_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all job notes"
  ON job_notes
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
      AND is_active = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;