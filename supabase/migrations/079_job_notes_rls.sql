-- Fix job_notes RLS policies to properly handle admin access and account filtering
-- This addresses 403 errors when admins try to access job notes

-- Ensure RLS is enabled
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Technicians can manage their own notes" ON public.job_notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON public.job_notes;
DROP POLICY IF EXISTS "Admins can manage notes" ON public.job_notes;
DROP POLICY IF EXISTS "Techs can view notes for assigned jobs" ON public.job_notes;
DROP POLICY IF EXISTS "Techs can insert notes for assigned jobs" ON public.job_notes;

-- Create ADMIN/OWNER read policy scoped by account_id
CREATE POLICY "Admins can view notes"
  ON public.job_notes
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER','ADMIN')
        AND is_active = true
    )
  );

-- Create TECH read policy: tech can see notes for jobs assigned to them
CREATE POLICY "Techs can view notes for assigned jobs"
  ON public.job_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
    )
  );

-- Create TECH insert policy: tech can insert notes for jobs assigned to them,
-- AND must set technician_id = auth.uid(), AND must set account_id to the job's account_id
CREATE POLICY "Techs can insert notes for assigned jobs"
  ON public.job_notes
  FOR INSERT
  WITH CHECK (
    technician_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_notes.account_id
    )
  );