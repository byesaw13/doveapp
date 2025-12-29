-- MVP Spine RLS Fixups (post-074)
-- Purpose:
-- 1) Ensure TECH can only see assigned jobs (not all account jobs)
-- 2) Remove direct TECH UPDATE on jobs (RLS cannot restrict columns)
-- 3) Ensure RLS is enabled on jobs (in case it wasn't)

-- Ensure RLS is enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;

-- =========================
-- JOBS: tighten visibility + remove unsafe tech update
-- =========================

-- 074 policy was too broad for TECH (it allowed all account members to view all jobs)
DROP POLICY IF EXISTS "Account members can view jobs" ON jobs;

-- 074 tech update policy allows updating ANY columns; remove it
DROP POLICY IF EXISTS "Techs can update status on assigned jobs" ON jobs;

-- Keep (or recreate) Admin/Owner policies safely
-- If these already exist, dropping/recreating is harmless and avoids duplicates.
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

-- Admin/Owner can view all jobs in account
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

-- Tech can view ONLY assigned jobs
-- (We keep your existing "Techs can view assigned jobs" if it's already present,
-- but re-create it to ensure it exists after policy changes.)
DROP POLICY IF EXISTS "Techs can view assigned jobs" ON jobs;
CREATE POLICY "Techs can view assigned jobs"
  ON jobs
  FOR SELECT
  USING (
    assigned_tech_id = auth.uid()
    AND account_id IN (
      SELECT account_id FROM account_memberships
      WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
    )
  );

-- NOTE: Tech status updates should be done via a SECURITY DEFINER function (RPC).
-- This migration removes direct UPDATE permission for TECH for safety.

