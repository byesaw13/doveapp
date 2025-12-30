-- Normalize technician assignment to jobs.assigned_tech_id -> users.id

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_technician_id_fkey;

DROP INDEX IF EXISTS idx_jobs_technician_id;

ALTER TABLE jobs
  DROP COLUMN IF EXISTS technician_id;

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_assigned_tech_id_fkey,
  ADD CONSTRAINT jobs_assigned_tech_id_fkey
    FOREIGN KEY (assigned_tech_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_tech_id ON jobs(assigned_tech_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'team_assignments'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view assignments for jobs they''re assigned to" ON team_assignments';
    EXECUTE 'CREATE POLICY "Users can view assignments for jobs they''re assigned to" ON team_assignments FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = team_assignments.job_id AND jobs.assigned_tech_id = auth.uid()))';
  END IF;
END $$;
