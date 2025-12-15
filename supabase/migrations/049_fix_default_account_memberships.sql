-- Fix default-account membership pollution and enforce account scoping

-- 1) Remove default-account memberships that were added on top of real memberships.
--    Migration 048 granted every auth user an OWNER membership on the default account.
--    That causes multiple memberships and breaks app redirects. Keep the default
--    membership only for users who have no other active membership.
WITH users_with_real_membership AS (
  SELECT DISTINCT user_id
  FROM account_memberships
  WHERE account_id <> '00000000-0000-0000-0000-000000000001'
    AND is_active = true
)
DELETE FROM account_memberships am
WHERE am.account_id = '00000000-0000-0000-0000-000000000001'
  AND am.user_id IN (SELECT user_id FROM users_with_real_membership);

-- 2) Enforce account scoping on key tables now that backfill is complete.
--    If any NULLs remain, raise a clear error so they can be fixed explicitly.
DO $$
DECLARE
  clients_nulls INTEGER;
  customers_nulls INTEGER;
BEGIN
  SELECT COUNT(*) INTO clients_nulls FROM clients WHERE account_id IS NULL;
  IF clients_nulls > 0 THEN
    RAISE EXCEPTION 'clients.account_id still NULL for % rows; backfill before enforcing NOT NULL', clients_nulls;
  ELSE
    ALTER TABLE clients ALTER COLUMN account_id SET NOT NULL;
  END IF;

  SELECT COUNT(*) INTO customers_nulls FROM customers WHERE account_id IS NULL;
  IF customers_nulls > 0 THEN
    RAISE EXCEPTION 'customers.account_id still NULL for % rows; backfill before enforcing NOT NULL', customers_nulls;
  ELSE
    ALTER TABLE customers ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;

-- 3) Comment to document expected state.
COMMENT ON TABLE account_memberships IS 'Links users to accounts with specific roles (OWNER, ADMIN, TECH). Default account membership should only exist if no other account membership is present.';
