-- Reassign tenant data from the default account to Dovetails Services LLC
DO $$
DECLARE
  v_default UUID := '00000000-0000-0000-0000-000000000001';
  v_target UUID;
BEGIN
  SELECT id INTO v_target FROM accounts WHERE name = 'Dovetails Services LLC' LIMIT 1;
  IF v_target IS NULL THEN
    RAISE NOTICE 'Target account "Dovetails Services LLC" not found - skipping data reassignment';
    RETURN;
  END IF;

  -- Helper to update a table if it has an account_id column
  PERFORM 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE clients SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE customers SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE jobs SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'estimates' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE estimates SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE invoices SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE leads SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE time_entries SET account_id = v_target WHERE account_id = v_default;
  END IF;

  PERFORM 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'account_id';
  IF FOUND THEN
    UPDATE properties SET account_id = v_target WHERE account_id = v_default;
  END IF;
END $$;
