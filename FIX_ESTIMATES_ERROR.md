# Fix: Estimates-Leads Relationship Error

## The Error

```
Error fetching estimates: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'estimates' and 'leads'...",
  message: "Could not find a relationship between 'estimates' and 'leads' in the schema cache"
}
```

## Why This Happens

The `leads` table or the foreign key relationship hasn't been created in your Supabase database yet.

## Solution (Choose One)

### Option 1: Run the Migration (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Copy and paste the SQL below and click **Run**:

```sql
-- Migration 025: Ensure Estimates-Leads Relationship
-- This will create the leads table if needed and ensure the relationship exists

-- Step 1: Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  source TEXT NOT NULL CHECK (source IN (
    'website', 'referral', 'social_media', 'email', 'phone',
    'walk_in', 'advertisement', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'proposal_sent',
    'negotiating', 'converted', 'lost', 'unqualified'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  service_type TEXT,
  service_description TEXT,
  estimated_value DECIMAL(10, 2),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  assigned_to TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lost_reason TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Ensure foreign key relationship exists
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'estimates_lead_id_fkey'
    AND table_name = 'estimates'
  ) THEN
    ALTER TABLE estimates DROP CONSTRAINT estimates_lead_id_fkey;
  END IF;

  -- Recreate the foreign key
  ALTER TABLE estimates
  ADD CONSTRAINT estimates_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES leads(id)
  ON DELETE SET NULL;
END $$;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON estimates(lead_id);

-- Step 4: Refresh schema cache
COMMENT ON TABLE estimates IS 'Estimates and quotes for potential jobs - Updated';
COMMENT ON TABLE leads IS 'Lead tracking and management - Updated';
```

5. Refresh your app page - the error should be gone!

### Option 2: Temporary Workaround (Already Applied)

I've updated the code to handle this gracefully. The estimates page will now work even without the leads relationship, but you won't see lead information on estimates.

**To get full functionality (showing lead names on estimates), you must run the migration above.**

## Verification

After running the migration, verify it worked:

```sql
-- Check if the relationship exists
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'estimates'
  AND kcu.column_name = 'lead_id';
```

You should see: `estimates | lead_id | leads`

## What Changed in the Code

**File: `lib/db/estimates.ts`**

- Added fallback logic to handle missing relationships
- Now shows a warning in console instead of crashing
- Estimates will load even without the leads table

The app now works in "degraded mode" until you run the migration!
