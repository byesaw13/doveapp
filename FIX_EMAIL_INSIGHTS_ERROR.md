# Fix: Email Insights Column Name Error

## The Error

```
Error fetching insights: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column email_insights.email_raw_id does not exist'
}
```

## Why This Happens

There was an inconsistency in the migration files:

- The `email_insights` table was created with a column named `email_id` (correct)
- But an index was created on `email_raw_id` (incorrect)
- Some code was referencing the wrong column name

## Solution

### ✅ Code Fix (Already Applied)

I've fixed the code to use the correct column name `email_id`:

- `lib/email-processing-pipeline.ts:39` - Fixed query
- `app/api/email-intelligence/reprocess-all/route.ts:27,37` - Fixed queries

### 🔧 Database Migration (Optional but Recommended)

Run this SQL in your Supabase SQL Editor to clean up:

```sql
-- Fix email_insights column name inconsistency
-- The table uses 'email_id' but some code was referencing 'email_raw_id'

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
```

## Verification

After the fix, verify your table structure:

```sql
-- Check the email_insights columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'email_insights'
ORDER BY ordinal_position;
```

You should see `email_id` (not `email_raw_id`) in the results.

## Files Changed

1. **lib/email-processing-pipeline.ts:39** - Changed `email_raw_id` → `email_id`
2. **app/api/email-intelligence/reprocess-all/route.ts:27,37** - Changed `email_raw_id` → `email_id`
3. **supabase/migrations/026_fix_email_insights_column_name.sql** - New migration to fix indexes

## Current Status

✅ Code fixed - Email reprocessing will now work  
✅ Migration created - Run it to clean up indexes  
✅ No data loss - This is just a naming fix

Your email intelligence system should now work correctly! 🎉
