-- Phase 1 Job Lifecycle Guardrails
-- Add minimal DB constraints and indexes for job status lifecycle

-- A) Update jobs.status CHECK constraint to include new statuses while preserving existing ones
-- Existing check allows: 'quote', 'scheduled', 'in_progress', 'completed', 'invoiced', 'cancelled'
-- New set includes: draft, scheduled, in_progress, blocked, completed, cancelled/canceled (accept both spellings)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'quote', 'scheduled', 'in_progress', 'blocked', 'completed', 'invoiced', 'cancelled', 'canceled'));

-- B) Ensure jobs.account_id is NOT NULL (already enforced by migration 058)

-- C) Add composite index for Phase 1 queries
CREATE INDEX IF NOT EXISTS idx_jobs_account_status_date ON jobs(account_id, status, service_date);

-- D) Add status_changed_at timestamp column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();
