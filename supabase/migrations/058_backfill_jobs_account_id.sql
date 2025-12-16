-- Backfill account_id for existing jobs
-- Set account_id based on the account membership of the user who created the job
-- If no account found, use the default Dovetails account

UPDATE jobs
SET account_id = COALESCE(
  (
    SELECT am.account_id
    FROM account_memberships am
    WHERE am.user_id = jobs.technician_id
    AND am.is_active = true
    LIMIT 1
  ),
  '6785bba1-553c-4886-9638-460033ad6b01' -- Default Dovetails account
)
WHERE account_id IS NULL;

-- Make account_id NOT NULL after backfilling
ALTER TABLE jobs ALTER COLUMN account_id SET NOT NULL;