-- Apply job_notes FK and RLS fixes manually
-- Run this in Supabase SQL Editor

-- First, apply the FK fix
ALTER TABLE public.job_notes
  DROP CONSTRAINT IF EXISTS job_notes_technician_id_fkey;

UPDATE public.job_notes
SET technician_id = NULL
WHERE technician_id IS NOT NULL
  AND technician_id NOT IN (SELECT id FROM public.users);

ALTER TABLE public.job_notes
  ADD CONSTRAINT job_notes_technician_id_fkey
  FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Then apply the RLS policy fixes
DROP POLICY IF EXISTS "Technicians can manage their own notes" ON job_notes;
DROP POLICY IF EXISTS "Admins can view all notes" ON job_notes;

-- Create new policies with proper account filtering and permissions
CREATE POLICY "Technicians can manage their notes on assigned jobs" ON job_notes
  FOR ALL USING (
    auth.uid() = technician_id
    AND EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id
      AND j.account_id IN (
        SELECT account_id FROM account_memberships
        WHERE user_id = auth.uid()
        AND role = 'TECH'
        AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can view all notes in their accounts" ON job_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id
      AND j.account_id IN (
        SELECT account_id FROM account_memberships
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'OWNER')
        AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can create notes in their accounts" ON job_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id
      AND j.account_id IN (
        SELECT account_id FROM account_memberships
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'OWNER')
        AND is_active = true
      )
    )
  );

-- Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');