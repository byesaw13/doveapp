-- Harden job_notes RLS for Option A tenant isolation.

ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

-- Remove existing job_notes policies to avoid conflicting access paths.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_notes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Admin/Owner: full access within tenant scope.
CREATE POLICY job_notes_admin_manage
  ON public.job_notes FOR ALL
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  );

-- Authenticated: tenant-scoped read via JWT account_id claim.
CREATE POLICY job_notes_account_read
  ON public.job_notes FOR SELECT
  USING (
    account_id = current_setting('request.jwt.claim.account_id', true)::uuid
  );

-- Tech: insert notes only for assigned jobs in their account.
CREATE POLICY job_notes_tech_insert_assigned
  ON public.job_notes FOR INSERT
  WITH CHECK (
    technician_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_notes.account_id
    )
  );
