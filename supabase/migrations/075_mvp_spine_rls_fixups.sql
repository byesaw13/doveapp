-- MVP Spine RLS Fixups (post-074)
-- Tighten TECH visibility and remove unsafe TECH job updates

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Remove the too-broad "everyone in account can view all jobs" policy
DROP POLICY IF EXISTS "Account members can view jobs" ON jobs;

-- Remove unsafe direct TECH UPDATE (RLS can't restrict columns)
DROP POLICY IF EXISTS "Techs can update status on assigned jobs" ON jobs;

-- Ensure Admin/Owner policies exist and are correct
DROP POLICY IF EXISTS "Admins can view jobs" ON jobs;
CREATE POLICY "Admins can view jobs"
  ON jobs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;
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
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  );

-- Tech can only view assigned jobs
DROP POLICY IF EXISTS "Techs can view assigned jobs" ON jobs;
CREATE POLICY "Techs can view assigned jobs"
  ON jobs
  FOR SELECT
  USING (
    assigned_tech_id = auth.uid()
    AND account_id IN (
      SELECT account_id
      FROM account_memberships
      WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
    )
  );
