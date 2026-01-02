-- Time tracking account scoping and RLS hardening
-- Adds account_id to time_breaks, time_approvals, technician_locations, technician_rates
-- and tightens policies to enforce tenant isolation.

-- Add account_id columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_breaks' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE time_breaks ADD COLUMN account_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_approvals' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE time_approvals ADD COLUMN account_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technician_locations' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE technician_locations ADD COLUMN account_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technician_rates' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE technician_rates ADD COLUMN account_id UUID;
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_breaks') THEN
    ALTER TABLE time_breaks ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_approvals') THEN
    ALTER TABLE time_approvals ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_locations') THEN
    ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_rates') THEN
    ALTER TABLE technician_rates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policies for time_breaks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_breaks' AND column_name = 'account_id'
  ) THEN
    DROP POLICY IF EXISTS "account members can view time_breaks" ON time_breaks;
    CREATE POLICY "account members can view time_breaks"
      ON time_breaks
      FOR SELECT
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "techs manage time_breaks" ON time_breaks;
    CREATE POLICY "techs manage time_breaks"
      ON time_breaks
      FOR ALL
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      )
      WITH CHECK (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      );
  END IF;
END $$;

-- Policies for time_approvals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_approvals' AND column_name = 'account_id'
  ) THEN
    DROP POLICY IF EXISTS "account members can view time_approvals" ON time_approvals;
    CREATE POLICY "account members can view time_approvals"
      ON time_approvals
      FOR SELECT
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "techs manage time_approvals" ON time_approvals;
    CREATE POLICY "techs manage time_approvals"
      ON time_approvals
      FOR ALL
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      )
      WITH CHECK (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      );
  END IF;
END $$;

-- Policies for technician_locations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technician_locations' AND column_name = 'account_id'
  ) THEN
    DROP POLICY IF EXISTS "account members can view technician_locations" ON technician_locations;
    CREATE POLICY "account members can view technician_locations"
      ON technician_locations
      FOR SELECT
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "techs manage technician_locations" ON technician_locations;
    CREATE POLICY "techs manage technician_locations"
      ON technician_locations
      FOR ALL
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      )
      WITH CHECK (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN','TECH') AND is_active = true
        )
      );
  END IF;
END $$;

-- Policies for technician_rates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technician_rates' AND column_name = 'account_id'
  ) THEN
    DROP POLICY IF EXISTS "account members can view technician_rates" ON technician_rates;
    CREATE POLICY "account members can view technician_rates"
      ON technician_rates
      FOR SELECT
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "admins manage technician_rates" ON technician_rates;
    CREATE POLICY "admins manage technician_rates"
      ON technician_rates
      FOR ALL
      USING (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN') AND is_active = true
        )
      )
      WITH CHECK (
        account_id IN (
          SELECT account_id FROM account_memberships
          WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN') AND is_active = true
        )
      );
  END IF;
END $$;
