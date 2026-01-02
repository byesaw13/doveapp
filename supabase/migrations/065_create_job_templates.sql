-- Update job templates table with enhanced schema
-- NOTE: supersedes/extends 013; kept for historical order
-- Non-destructive migration for job_templates

-- Add new columns (non-destructive)
ALTER TABLE job_templates
  ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Ensure created_by exists; add if missing
ALTER TABLE job_templates
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Backfill template_data from existing columns
UPDATE job_templates
SET template_data = jsonb_build_object(
  'title_template',
  COALESCE(title_template, ''),
  'description_template',
  COALESCE(description_template, ''),
  'default_line_items',
  COALESCE(default_line_items, '[]'::jsonb),
  'service_date_offset_days',
  COALESCE(service_date_offset_days, 0),
  'default_priority',
  COALESCE(default_priority, 'medium')
)
WHERE template_data IS NULL
  OR template_data = '{}'::jsonb;

-- Enforce NOT NULL only if safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'job_templates'
      AND column_name = 'template_data'
      AND is_nullable = 'NO'
  ) AND NOT EXISTS (
    SELECT 1 FROM job_templates WHERE template_data IS NULL
  ) THEN
    ALTER TABLE job_templates ALTER COLUMN template_data SET NOT NULL;
  END IF;
END $$;

-- Add FK for created_by if safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_templates_created_by_fkey'
  ) AND NOT EXISTS (
    SELECT 1
    FROM job_templates jt
    WHERE jt.created_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = jt.created_by
      )
  ) THEN
    ALTER TABLE job_templates
      ADD CONSTRAINT job_templates_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_templates_category ON job_templates(category);
CREATE INDEX IF NOT EXISTS idx_job_templates_created_by ON job_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_job_templates_usage_count ON job_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_job_templates_is_public ON job_templates(is_public)
  WHERE is_public = true;

-- Enable RLS
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Drop previous policies (from 013)
DROP POLICY IF EXISTS "Allow reading active job templates" ON job_templates;
DROP POLICY IF EXISTS "Allow creating job templates" ON job_templates;
DROP POLICY IF EXISTS "Allow updating job templates" ON job_templates;

-- Drop new policies if rerunning
DROP POLICY IF EXISTS "Users can view public templates and their own templates"
  ON job_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON job_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON job_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON job_templates;

-- Create policies
CREATE POLICY "Users can view public templates and their own templates"
  ON job_templates FOR SELECT USING (
    is_public = true OR created_by = auth.uid()
  );

CREATE POLICY "Users can create their own templates"
  ON job_templates FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON job_templates FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON job_templates FOR DELETE USING (auth.uid() = created_by);

-- Update trigger (idempotent)
CREATE OR REPLACE FUNCTION update_job_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'job_templates_updated_at'
  ) THEN
    CREATE TRIGGER job_templates_updated_at
      BEFORE UPDATE ON job_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_job_templates_updated_at();
  END IF;
END $$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE job_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

