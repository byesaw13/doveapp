-- Fix customers table to support multi-portal architecture
-- This resolves the conflict between migration 033 and 037
-- where migration 037's customers table was never created due to IF NOT EXISTS

-- Add missing columns to the customers table that was created by migration 033
-- These columns are required by the multi-portal architecture (migration 037)

ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Rename full_name to name for consistency with multi-portal schema
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'full_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'name'
    ) THEN
        ALTER TABLE customers RENAME COLUMN full_name TO name;
    END IF;
END $$;

-- Add foreign key constraints for account_id and user_id
-- Note: We make account_id nullable for now to avoid breaking existing data
-- It will be made NOT NULL after backfilling in a subsequent migration

DO $$
BEGIN
    -- Add account_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_account_id_fkey'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
    END IF;

    -- Add user_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_user_id_fkey'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for multi-tenant queries
CREATE INDEX IF NOT EXISTS customers_account_id_idx ON customers(account_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);

-- Add comment to clarify table purpose
COMMENT ON TABLE customers IS 'Multi-portal customer records with account scoping. Used by messaging system and customer portal.';
