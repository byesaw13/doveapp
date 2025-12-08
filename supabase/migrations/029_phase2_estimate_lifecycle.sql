-- Phase 2: Estimate Lifecycle Updates
-- Update estimates table with new fields for approval workflow

ALTER TABLE estimates ADD COLUMN IF NOT EXISTS approval_info JSONB;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS decline_info JSONB;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS sent_history JSONB DEFAULT '[]';

-- Update status enum to include new statuses
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status IN ('draft', 'pending', 'sent', 'approved', 'declined', 'expired', 'revised'));

-- Update jobs table to include estimate relationship and new fields
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Update job status enum (keeping existing statuses for backward compatibility)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'quote', 'scheduled', 'in_progress', 'completed', 'invoiced', 'cancelled'));

-- Update job_line_items table to include service relationship
ALTER TABLE job_line_items ADD COLUMN IF NOT EXISTS service_id INTEGER;
ALTER TABLE job_line_items ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE job_line_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(10, 2);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_id ON jobs(estimate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_job_line_items_service_id ON job_line_items(service_id);