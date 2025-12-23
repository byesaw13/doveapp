-- Add portal customer management columns
-- This adds the necessary columns for customer portal invitations and management

ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Update existing records to split name into first_name and last_name
DO $$
DECLARE
    name_column TEXT;
BEGIN
    -- Check which name column exists
    SELECT column_name INTO name_column
    FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name IN ('name', 'full_name')
    LIMIT 1;

    -- Only update if we found a name column and first_name is null
    IF name_column IS NOT NULL THEN
        EXECUTE format('
            UPDATE customers
            SET
                first_name = SPLIT_PART(%I, '' '', 1),
                last_name = CASE
                    WHEN array_length(string_to_array(%I, '' ''), 1) > 1
                    THEN array_to_string((string_to_array(%I, '' ''))[2:], '' '')
                    ELSE ''''
                END
            WHERE first_name IS NULL AND %I IS NOT NULL
        ', name_column, name_column, name_column, name_column);
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);
CREATE INDEX IF NOT EXISTS customers_invited_at_idx ON customers(invited_at);
CREATE INDEX IF NOT EXISTS customers_created_by_idx ON customers(created_by);

-- Add check constraint for status values
ALTER TABLE customers ADD CONSTRAINT customers_status_check
    CHECK (status IN ('invited', 'active', 'inactive'));

-- Update comment
COMMENT ON TABLE customers IS 'Multi-portal customer records with account scoping. Used by messaging system and customer portal invitations.';