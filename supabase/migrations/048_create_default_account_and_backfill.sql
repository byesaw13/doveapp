-- Create a default account and backfill account_id for existing data
-- This is necessary because existing data has NULL account_id values

-- Step 1: Create a default account if one doesn't exist
INSERT INTO accounts (id, name, subdomain, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Account',
    'default',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: For any users without accounts, create a user record and membership
DO $$
DECLARE
    auth_user RECORD;
    user_exists BOOLEAN;
BEGIN
    -- Get all auth.users
    FOR auth_user IN 
        SELECT id, email, raw_user_meta_data->>'full_name' as full_name
        FROM auth.users
    LOOP
        -- Check if user exists in users table
        SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user.id) INTO user_exists;
        
        IF NOT user_exists THEN
            -- Create user record
            INSERT INTO users (id, email, full_name, created_at, updated_at)
            VALUES (
                auth_user.id,
                auth_user.email,
                auth_user.full_name,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
        
        -- Create account membership if it doesn't exist
        INSERT INTO account_memberships (account_id, user_id, role, is_active, created_at, updated_at)
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            auth_user.id,
            'OWNER',  -- Make first users owners
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (account_id, user_id) DO NOTHING;
    END LOOP;
END $$;

-- Step 3: Backfill account_id for existing data
-- All existing data goes to the default account

-- Backfill clients.account_id
UPDATE clients 
SET account_id = '00000000-0000-0000-0000-000000000001'
WHERE account_id IS NULL;

-- Backfill customers.account_id
UPDATE customers 
SET account_id = '00000000-0000-0000-0000-000000000001'
WHERE account_id IS NULL;

-- Backfill jobs.account_id
UPDATE jobs 
SET account_id = '00000000-0000-0000-0000-000000000001'
WHERE account_id IS NULL;

-- Backfill estimates.account_id
UPDATE estimates 
SET account_id = '00000000-0000-0000-0000-000000000001'
WHERE account_id IS NULL;

-- Backfill invoices.account_id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'account_id'
    ) THEN
        UPDATE invoices 
        SET account_id = '00000000-0000-0000-0000-000000000001'
        WHERE account_id IS NULL;
    END IF;
END $$;

-- Backfill leads.account_id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'account_id'
    ) THEN
        UPDATE leads 
        SET account_id = '00000000-0000-0000-0000-000000000001'
        WHERE account_id IS NULL;
    END IF;
END $$;

-- Backfill time_entries.account_id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'account_id'
    ) THEN
        UPDATE time_entries 
        SET account_id = '00000000-0000-0000-0000-000000000001'
        WHERE account_id IS NULL;
    END IF;
END $$;

-- Backfill properties.account_id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'account_id'
    ) THEN
        UPDATE properties 
        SET account_id = '00000000-0000-0000-0000-000000000001'
        WHERE account_id IS NULL;
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE accounts IS 'Multi-tenant accounts. Each business is an account with multiple users.';
COMMENT ON TABLE account_memberships IS 'Links users to accounts with specific roles (OWNER, ADMIN, TECH).';
