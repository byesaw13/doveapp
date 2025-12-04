-- Fix email_insights column name inconsistency
-- The table uses 'email_id' but some code was referencing 'email_raw_id'
-- This migration ensures the index is on the correct column

-- Drop the incorrect index if it exists
DROP INDEX IF EXISTS idx_email_insights_email_raw_id;

-- Ensure the correct index exists
CREATE INDEX IF NOT EXISTS idx_email_insights_email_id ON email_insights(email_id);

-- Verify the foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%email_insights%email_id%fkey%' 
    AND table_name = 'email_insights'
  ) THEN
    ALTER TABLE email_insights 
    ADD CONSTRAINT email_insights_email_id_fkey 
    FOREIGN KEY (email_id) 
    REFERENCES emails_raw(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment to document the fix
COMMENT ON TABLE email_insights IS 'Email analysis and insights - uses email_id column (not email_raw_id)';
