-- Ensure the foreign key relationship between estimates and leads exists
-- This migration is idempotent and safe to run multiple times

-- Drop the foreign key if it exists (to recreate it)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'estimates_lead_id_fkey' 
    AND table_name = 'estimates'
  ) THEN
    ALTER TABLE estimates DROP CONSTRAINT estimates_lead_id_fkey;
  END IF;
END $$;

-- Recreate the foreign key relationship
ALTER TABLE estimates 
ADD CONSTRAINT estimates_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES leads(id) 
ON DELETE SET NULL;

-- Ensure the index exists
CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON estimates(lead_id);

-- Refresh the Supabase schema cache by updating table comment
COMMENT ON TABLE estimates IS 'Estimates and quotes for potential jobs';
COMMENT ON TABLE leads IS 'Lead tracking and management';
