-- Create job checklist items table
CREATE TABLE job_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policy for technicians and admins
CREATE POLICY "Technicians and admins can manage checklist items" ON job_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_memberships am
      JOIN jobs j ON j.id = job_checklist_items.job_id
      WHERE am.user_id = auth.uid()
      AND am.account_id = j.account_id
      AND am.role IN ('admin', 'owner', 'tech')
      AND am.is_active = true
    )
  );

-- Create indexes
CREATE INDEX idx_job_checklist_items_job_id ON job_checklist_items(job_id);
CREATE INDEX idx_job_checklist_items_sort_order ON job_checklist_items(sort_order);

-- Add trigger for updated_at
CREATE TRIGGER update_job_checklist_items_updated_at
  BEFORE UPDATE ON job_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();