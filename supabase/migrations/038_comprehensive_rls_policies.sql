-- Comprehensive Row Level Security (RLS) Policies for Multi-Tenant Architecture
-- This migration enables RLS on all multi-tenant tables and creates policies
-- FIXED VERSION: Checks for column existence before creating policies

-- ============================================================================
-- CORE MULTI-TENANT TABLES
-- ============================================================================

-- Accounts table (from migration 037)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
    ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
    
    -- Users can view accounts they're members of
    CREATE POLICY "Users can view their accounts"
      ON accounts
      FOR SELECT
      USING (
        id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    -- Only owners can update their account
    CREATE POLICY "Owners can update their account"
      ON accounts
      FOR UPDATE
      USING (
        id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role = 'OWNER' AND is_active = true
        )
      );
  END IF;
END $$;

-- Users table (from migration 037)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Users can view their own profile
    CREATE POLICY "Users can view own profile"
      ON users
      FOR SELECT
      USING (id = auth.uid());

    -- Users can update their own profile
    CREATE POLICY "Users can update own profile"
      ON users
      FOR UPDATE
      USING (id = auth.uid());

    -- Allow insert for new user registration
    CREATE POLICY "Users can insert own profile"
      ON users
      FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Account memberships table (from migration 037)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_memberships') THEN
    ALTER TABLE account_memberships ENABLE ROW LEVEL SECURITY;
    
    -- Users can view memberships for their accounts
    CREATE POLICY "Users can view account memberships"
      ON account_memberships
      FOR SELECT
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    -- Only owners and admins can manage memberships
    CREATE POLICY "Admins can manage memberships"
      ON account_memberships
      FOR ALL
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() 
          AND role IN ('OWNER', 'ADMIN')
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- CUSTOMER DATA
-- ============================================================================

-- Customers table (from migration 037)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    
    -- Check if account_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'account_id'
    ) THEN
      -- Account members can view their account's customers
      CREATE POLICY "Account members can view customers"
        ON customers
        FOR SELECT
        USING (
          account_id IN (
            SELECT account_id FROM account_memberships
            WHERE user_id = auth.uid() AND is_active = true
          )
          OR user_id = auth.uid() -- Customer can view their own record
        );

      -- Admins can insert customers
      CREATE POLICY "Admins can insert customers"
        ON customers
        FOR INSERT
        WITH CHECK (
          account_id IN (
            SELECT account_id FROM account_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('OWNER', 'ADMIN')
            AND is_active = true
          )
        );

      -- Admins can update customers
      CREATE POLICY "Admins can update customers"
        ON customers
        FOR UPDATE
        USING (
          account_id IN (
            SELECT account_id FROM account_memberships
            WHERE user_id = auth.uid() 
            AND role IN ('OWNER', 'ADMIN')
            AND is_active = true
          )
        );
    ELSE
      -- Fallback: If no account_id, allow authenticated users to manage
      CREATE POLICY "Authenticated users can manage customers"
        ON customers
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- LEGACY CLIENTS TABLE
-- ============================================================================

-- Enable RLS on clients table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    
    -- Temporary permissive policy for legacy data
    CREATE POLICY "Authenticated users can view clients"
      ON clients
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    -- All authenticated users can manage clients (for now)
    CREATE POLICY "Authenticated users can manage clients"
      ON clients
      FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- JOBS
-- ============================================================================

-- Jobs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    
    -- Check if account_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'account_id'
    ) THEN
      -- Account members can view their account's jobs
      CREATE POLICY "Account members can view jobs"
        ON jobs
        FOR SELECT
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() AND is_active = true
              )
            ELSE true -- Legacy jobs without account_id
          END
        );
      
      -- Admins and techs can manage jobs
      CREATE POLICY "Staff can manage jobs"
        ON jobs
        FOR ALL
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() 
                AND role IN ('OWNER', 'ADMIN', 'TECH')
                AND is_active = true
              )
            ELSE true -- Legacy jobs
          END
        );
    ELSE
      -- Fallback: No account_id column yet
      CREATE POLICY "Authenticated users can manage jobs"
        ON jobs
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ESTIMATES
-- ============================================================================

-- Estimates table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'estimates') THEN
    ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'estimates' AND column_name = 'account_id'
    ) THEN
      -- Account members can view their account's estimates
      CREATE POLICY "Account members can view estimates"
        ON estimates
        FOR SELECT
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() AND is_active = true
              )
            ELSE true -- Legacy estimates
          END
        );
      
      -- Admins can manage estimates
      CREATE POLICY "Admins can manage estimates"
        ON estimates
        FOR ALL
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() 
                AND role IN ('OWNER', 'ADMIN')
                AND is_active = true
              )
            ELSE true -- Legacy estimates
          END
        );
    ELSE
      -- Fallback
      CREATE POLICY "Authenticated users can manage estimates"
        ON estimates
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- LEADS
-- ============================================================================

-- Leads table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'account_id'
    ) THEN
      CREATE POLICY "Account members can view leads"
        ON leads
        FOR SELECT
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() AND is_active = true
              )
            ELSE true -- Legacy leads
          END
        );
      
      CREATE POLICY "Admins can manage leads"
        ON leads
        FOR ALL
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() 
                AND role IN ('OWNER', 'ADMIN')
                AND is_active = true
              )
            ELSE true -- Legacy leads
          END
        );
    ELSE
      CREATE POLICY "Authenticated users can manage leads"
        ON leads
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- TIME TRACKING
-- ============================================================================

-- Time entries table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
    ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'account_id'
    ) THEN
      CREATE POLICY "Account members can view time entries"
        ON time_entries
        FOR SELECT
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() AND is_active = true
              )
            ELSE true -- Legacy entries
          END
        );
      
      CREATE POLICY "Staff can manage time entries"
        ON time_entries
        FOR ALL
        USING (
          CASE 
            WHEN account_id IS NOT NULL THEN
              account_id IN (
                SELECT account_id FROM account_memberships
                WHERE user_id = auth.uid() 
                AND role IN ('OWNER', 'ADMIN', 'TECH')
                AND is_active = true
              )
            ELSE true -- Legacy entries
          END
        );
    ELSE
      CREATE POLICY "Authenticated users can manage time entries"
        ON time_entries
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- MATERIALS AND INVENTORY
-- ============================================================================

-- Materials table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
    ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
    
    -- All authenticated users can view materials (shared catalog)
    CREATE POLICY "Authenticated users can view materials"
      ON materials
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    -- Only admins can manage materials
    CREATE POLICY "Admins can manage materials"
      ON materials
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM account_memberships
          WHERE user_id = auth.uid() 
          AND role IN ('OWNER', 'ADMIN')
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- BUSINESS SETTINGS
-- ============================================================================

-- Business settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_settings') THEN
    ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
    
    -- All authenticated users can view (single-tenant for now)
    CREATE POLICY "Authenticated users can view settings"
      ON business_settings
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    -- Only admins can update
    CREATE POLICY "Admins can update settings"
      ON business_settings
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM account_memberships
          WHERE user_id = auth.uid() 
          AND role IN ('OWNER', 'ADMIN')
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- AUTOMATIONS
-- ============================================================================

-- Automations table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automations') THEN
    ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view automations"
      ON automations
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Admins can manage automations"
      ON automations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM account_memberships
          WHERE user_id = auth.uid() 
          AND role IN ('OWNER', 'ADMIN')
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- PROPERTIES
-- ============================================================================

-- Properties table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
    ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
    
    -- Members can view properties
    CREATE POLICY "Authenticated users can view properties"
      ON properties
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Staff can manage properties"
      ON properties
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM account_memberships
          WHERE user_id = auth.uid() 
          AND role IN ('OWNER', 'ADMIN', 'TECH')
          AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- INVOICES (checking if RLS already enabled)
-- ============================================================================

-- Invoices table - may already have RLS from migration 031
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    -- Check if RLS is already enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'invoices' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
      
      -- Create basic policies if not exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invoices' 
        AND policyname = 'Authenticated users can manage invoices'
      ) THEN
        CREATE POLICY "Authenticated users can manage invoices"
          ON invoices
          FOR ALL
          USING (auth.uid() IS NOT NULL);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies migration completed successfully';
  RAISE NOTICE 'All multi-tenant tables now have Row Level Security enabled';
  RAISE NOTICE 'NOTE: Some policies use permissive rules for legacy data without account_id';
  RAISE NOTICE 'TODO: Populate account_id columns and tighten policies';
END $$;
