-- Verify account-level isolation for tenant tables.
-- This script uses existing account_memberships to find two distinct accounts.
-- Expected results: *_own checks return >= 1 (if rows exist), *_other checks return 0.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_other_account_id uuid;
BEGIN
  SELECT user_id, account_id
  INTO v_user_id, v_account_id
  FROM public.account_memberships
  WHERE is_active = true
  LIMIT 1;

  SELECT account_id
  INTO v_other_account_id
  FROM public.account_memberships
  WHERE account_id <> v_account_id
  LIMIT 1;

  IF v_user_id IS NULL OR v_account_id IS NULL OR v_other_account_id IS NULL THEN
    RAISE EXCEPTION 'Need at least two accounts with memberships to verify isolation.';
  END IF;

  PERFORM set_config('app.test_user_id', v_user_id::text, true);
  PERFORM set_config('app.test_account_id', v_account_id::text, true);
  PERFORM set_config('app.test_other_account_id', v_other_account_id::text, true);
END $$;

SET LOCAL role authenticated;

SELECT set_config('request.jwt.claim.sub', current_setting('app.test_user_id', true), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.account_id', current_setting('app.test_account_id', true), true);

SELECT 'account_memberships_own' AS check_name, count(*) AS visible
FROM public.account_memberships
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'account_memberships_other' AS check_name, count(*) AS visible
FROM public.account_memberships
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'clients_own' AS check_name, count(*) AS visible
FROM public.clients
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'clients_other' AS check_name, count(*) AS visible
FROM public.clients
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'customers_own' AS check_name, count(*) AS visible
FROM public.customers
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'customers_other' AS check_name, count(*) AS visible
FROM public.customers
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'estimates_own' AS check_name, count(*) AS visible
FROM public.estimates
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'estimates_other' AS check_name, count(*) AS visible
FROM public.estimates
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'invoices_own' AS check_name, count(*) AS visible
FROM public.invoices
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'invoices_other' AS check_name, count(*) AS visible
FROM public.invoices
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'job_notes_own' AS check_name, count(*) AS visible
FROM public.job_notes
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'job_notes_other' AS check_name, count(*) AS visible
FROM public.job_notes
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'jobs_own' AS check_name, count(*) AS visible
FROM public.jobs
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'jobs_other' AS check_name, count(*) AS visible
FROM public.jobs
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'leads_own' AS check_name, count(*) AS visible
FROM public.leads
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'leads_other' AS check_name, count(*) AS visible
FROM public.leads
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'properties_own' AS check_name, count(*) AS visible
FROM public.properties
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'properties_other' AS check_name, count(*) AS visible
FROM public.properties
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'technician_locations_own' AS check_name, count(*) AS visible
FROM public.technician_locations
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'technician_locations_other' AS check_name, count(*) AS visible
FROM public.technician_locations
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'technician_rates_own' AS check_name, count(*) AS visible
FROM public.technician_rates
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'technician_rates_other' AS check_name, count(*) AS visible
FROM public.technician_rates
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'time_approvals_own' AS check_name, count(*) AS visible
FROM public.time_approvals
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'time_approvals_other' AS check_name, count(*) AS visible
FROM public.time_approvals
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'time_breaks_own' AS check_name, count(*) AS visible
FROM public.time_breaks
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'time_breaks_other' AS check_name, count(*) AS visible
FROM public.time_breaks
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'time_entries_own' AS check_name, count(*) AS visible
FROM public.time_entries
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'time_entries_other' AS check_name, count(*) AS visible
FROM public.time_entries
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

SELECT 'visits_own' AS check_name, count(*) AS visible
FROM public.visits
WHERE account_id = current_setting('app.test_account_id', true)::uuid;

SELECT 'visits_other' AS check_name, count(*) AS visible
FROM public.visits
WHERE account_id = current_setting('app.test_other_account_id', true)::uuid;

ROLLBACK;
