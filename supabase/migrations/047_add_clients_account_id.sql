-- Add account_id to clients table for multi-tenant support
-- The clients table is the legacy table used by jobs, estimates, invoices

-- Add account_id column if it doesn't exist (migration 037 may have already added it)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_account_id_fkey'
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE clients 
        ADD CONSTRAINT clients_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for multi-tenant queries
CREATE INDEX IF NOT EXISTS clients_account_id_idx ON clients(account_id);

-- Add comment to clarify table purpose
COMMENT ON TABLE clients IS 'Legacy client records. Used by jobs, estimates, and invoices. Consider migrating to customers table.';
