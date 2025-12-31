-- Tech portal RLS isolation for jobs, job notes, and related client access.

-- -------------------------------------------------------------------
-- Remove any allow-all policies on tech-facing tables
-- -------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('jobs', 'job_notes', 'clients')
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- -------------------------------------------------------------------
-- Ensure RLS enabled
-- -------------------------------------------------------------------
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- Jobs: Admin/Owner full access, Tech read/update assigned only
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS tech_jobs_admin_manage ON public.jobs;
CREATE POLICY tech_jobs_admin_manage
  ON public.jobs FOR ALL
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

DROP POLICY IF EXISTS tech_jobs_read_assigned ON public.jobs;
CREATE POLICY tech_jobs_read_assigned
  ON public.jobs FOR SELECT
  USING (
    assigned_tech_id = auth.uid()
    AND account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS tech_jobs_update_assigned ON public.jobs;
CREATE POLICY tech_jobs_update_assigned
  ON public.jobs FOR UPDATE
  USING (
    assigned_tech_id = auth.uid()
    AND account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
    )
  )
  WITH CHECK (
    assigned_tech_id = auth.uid()
    AND account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
    )
  );

-- -------------------------------------------------------------------
-- Job notes: Admin/Owner full access, Tech read/insert assigned only
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS tech_job_notes_admin_manage ON public.job_notes;
CREATE POLICY tech_job_notes_admin_manage
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

DROP POLICY IF EXISTS tech_job_notes_read_assigned ON public.job_notes;
CREATE POLICY tech_job_notes_read_assigned
  ON public.job_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_notes.account_id
    )
  );

DROP POLICY IF EXISTS tech_job_notes_insert_assigned ON public.job_notes;
CREATE POLICY tech_job_notes_insert_assigned
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

-- -------------------------------------------------------------------
-- Clients: Admin/Owner manage, Tech read only for assigned jobs
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS tech_clients_admin_manage ON public.clients;
CREATE POLICY tech_clients_admin_manage
  ON public.clients FOR ALL
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

DROP POLICY IF EXISTS tech_clients_read_assigned ON public.clients;
CREATE POLICY tech_clients_read_assigned
  ON public.clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.client_id = clients.id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = clients.account_id
    )
  );
