-- Create job_notes table for technician notes
CREATE TABLE job_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow technicians to manage their own notes and admins to see all
CREATE POLICY "Technicians can manage their own notes" ON job_notes
  FOR ALL USING (auth.uid() = technician_id);

CREATE POLICY "Admins can view all notes" ON job_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Create indexes
CREATE INDEX idx_job_notes_job_id ON job_notes(job_id);
CREATE INDEX idx_job_notes_technician_id ON job_notes(technician_id);
CREATE INDEX idx_job_notes_created_at ON job_notes(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_job_notes_updated_at
  BEFORE UPDATE ON job_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();