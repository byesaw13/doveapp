-- Verify tech isolation for jobs, job notes, and clients.
-- Expected results:
-- - tech sees assigned job (count = 1)
-- - tech sees 0 unassigned jobs (count = 0)
-- - tech sees notes only for assigned jobs (count = 1 / 0)
-- - tech sees only clients tied to assigned jobs (count = 1)

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_assigned_job_id uuid;
  v_other_job_id uuid;
  v_assigned_note_id uuid;
  v_other_note_id uuid;
  v_assigned_client_id uuid;
  v_sentinel uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  SELECT user_id, account_id
  INTO v_user_id, v_account_id
  FROM public.account_memberships
  WHERE role = 'TECH'
    AND is_active = true
  LIMIT 1;

  IF v_user_id IS NULL OR v_account_id IS NULL THEN
    RAISE EXCEPTION 'Missing required tech/account data to verify isolation.';
  END IF;

  SELECT id
  INTO v_assigned_job_id
  FROM public.jobs
  WHERE assigned_tech_id = v_user_id
    AND account_id = v_account_id
  LIMIT 1;

  SELECT id
  INTO v_other_job_id
  FROM public.jobs
  WHERE account_id = v_account_id
    AND (assigned_tech_id IS DISTINCT FROM v_user_id)
  LIMIT 1;

  SELECT id
  INTO v_assigned_note_id
  FROM public.job_notes
  WHERE job_id = v_assigned_job_id
  LIMIT 1;

  SELECT id
  INTO v_other_note_id
  FROM public.job_notes
  WHERE job_id = v_other_job_id
  LIMIT 1;

  SELECT client_id
  INTO v_assigned_client_id
  FROM public.jobs
  WHERE id = v_assigned_job_id;

  IF v_assigned_job_id IS NULL OR v_other_job_id IS NULL THEN
    RAISE NOTICE 'Missing assigned or unassigned job data; checks may return 0.';
  END IF;

  IF v_assigned_note_id IS NULL OR v_other_note_id IS NULL THEN
    RAISE NOTICE 'Missing job note data; note checks may return 0.';
  END IF;

  IF v_assigned_client_id IS NULL THEN
    RAISE NOTICE 'Missing client data; client check may return 0.';
  END IF;

  PERFORM set_config('app.tech_user_id', v_user_id::text, true);
  PERFORM set_config('app.tech_account_id', v_account_id::text, true);
  PERFORM set_config('app.tech_assigned_job_id', COALESCE(v_assigned_job_id, v_sentinel)::text, true);
  PERFORM set_config('app.tech_other_job_id', COALESCE(v_other_job_id, v_sentinel)::text, true);
  PERFORM set_config('app.tech_assigned_note_id', COALESCE(v_assigned_note_id, v_sentinel)::text, true);
  PERFORM set_config('app.tech_other_note_id', COALESCE(v_other_note_id, v_sentinel)::text, true);
  PERFORM set_config('app.tech_assigned_client_id', COALESCE(v_assigned_client_id, v_sentinel)::text, true);
END $$;

SET LOCAL role authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.tech_user_id', true), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.account_id', current_setting('app.tech_account_id', true), true);

SELECT 'assigned_jobs' AS check_name, count(*) AS visible
FROM public.jobs
WHERE id = current_setting('app.tech_assigned_job_id', true)::uuid;

SELECT 'unassigned_jobs' AS check_name, count(*) AS visible
FROM public.jobs
WHERE id = current_setting('app.tech_other_job_id', true)::uuid;

SELECT 'assigned_notes' AS check_name, count(*) AS visible
FROM public.job_notes
WHERE id = current_setting('app.tech_assigned_note_id', true)::uuid;

SELECT 'unassigned_notes' AS check_name, count(*) AS visible
FROM public.job_notes
WHERE id = current_setting('app.tech_other_note_id', true)::uuid;

SELECT 'assigned_clients' AS check_name, count(*) AS visible
FROM public.clients
WHERE id = current_setting('app.tech_assigned_client_id', true)::uuid;

ROLLBACK;
