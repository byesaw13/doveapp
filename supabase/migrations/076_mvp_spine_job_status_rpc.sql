-- MVP Spine: Safe TECH job status update via RPC
-- Tech can update job status only for jobs assigned to them, with allowed transitions.

CREATE OR REPLACE FUNCTION tech_update_job_status(p_job_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id uuid;
  v_current_status text;
BEGIN
  -- Ensure caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller is an active TECH on the same account AND is assigned to the job
  SELECT j.account_id, j.status
    INTO v_account_id, v_current_status
  FROM jobs j
  WHERE j.id = p_job_id
    AND j.assigned_tech_id = auth.uid();

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Job not found or not assigned to you';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM account_memberships am
    WHERE am.user_id = auth.uid()
      AND am.account_id = v_account_id
      AND am.role = 'TECH'
      AND am.is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate new status value
  IF p_new_status NOT IN ('scheduled', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- Enforce forward-only transitions
  IF v_current_status = 'scheduled' AND p_new_status NOT IN ('in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid transition';
  ELSIF v_current_status = 'in_progress' AND p_new_status <> 'completed' THEN
    RAISE EXCEPTION 'Invalid transition';
  ELSIF v_current_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot change status once completed';
  END IF;

  -- Update only the status
  UPDATE jobs
  SET status = p_new_status
  WHERE id = p_job_id
    AND assigned_tech_id = auth.uid();

  -- Optional: write a note for audit trail
  INSERT INTO job_notes (job_id, technician_id, note, account_id)
  VALUES (p_job_id, auth.uid(), 'Status changed to: ' || p_new_status, v_account_id);

END;
$$;

-- Lock down function privileges
REVOKE ALL ON FUNCTION tech_update_job_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tech_update_job_status(uuid, text) TO authenticated;

-- Harden function security
ALTER FUNCTION tech_update_job_status(uuid, text) SET search_path = public;
