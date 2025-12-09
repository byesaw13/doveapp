-- Phase 3: Jobs & Field Operations
-- Add new fields to jobs table for enhanced job management

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ready_for_invoice BOOLEAN NOT NULL DEFAULT false;

-- Ensure job status enum includes all required statuses (should already be correct from Phase 2)
-- Statuses: draft, quote, scheduled, in_progress, completed, invoiced, cancelled

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_for ON jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_jobs_estimate_id ON jobs(estimate_id);