-- Drop the existing technician_id foreign key if present
ALTER TABLE public.job_notes
  DROP CONSTRAINT IF EXISTS job_notes_technician_id_fkey;

-- Add a new foreign key from job_notes.technician_id to public.users(id)
ALTER TABLE public.job_notes
  ADD CONSTRAINT job_notes_technician_id_fkey
  FOREIGN KEY (technician_id) REFERENCES public.users(id);

-- (Optional but recommended) Add an index
CREATE INDEX IF NOT EXISTS idx_job_notes_technician_id ON public.job_notes(technician_id);

-- Force PostgREST schema cache reload
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;