-- Rename customer_id to client_id in invoices table for consistency
-- This aligns the database schema with the domain language used throughout the app

-- Check if the column needs to be renamed
DO $$
BEGIN
  -- Only run if customer_id exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'customer_id'
  ) THEN
    -- Step 1: Rename the column
    ALTER TABLE invoices RENAME COLUMN customer_id TO client_id;
    
    -- Step 2: Rename the foreign key constraint
    ALTER TABLE invoices RENAME CONSTRAINT invoices_customer_id_fkey TO invoices_client_id_fkey;
    
    -- Step 3: Drop old index and create new one with correct name
    DROP INDEX IF EXISTS idx_invoices_customer_id;
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    
    RAISE NOTICE 'Migration completed: customer_id renamed to client_id';
  ELSE
    RAISE NOTICE 'Migration skipped: customer_id column does not exist (already migrated or using client_id)';
  END IF;
END $$;

-- Note: This migration ensures consistency across the codebase
-- All references to "customer" in invoices context now use "client"
