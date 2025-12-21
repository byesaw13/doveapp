-- Ensure Nicolas Garon is linked to Dovetails Services LLC as OWNER
-- Skip if account or user doesn't exist (for local development)
DO $$
DECLARE
  v_acct_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_acct_id FROM accounts WHERE name = 'Dovetails Services LLC' LIMIT 1;
  IF v_acct_id IS NULL THEN
    RAISE NOTICE 'Account "Dovetails Services LLC" not found - skipping membership setup';
    RETURN;
  END IF;

  SELECT id INTO v_user_id FROM users WHERE email = 'nicolasgaron@mydovetails.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User "nicolasgaron@mydovetails.com" not found - skipping membership setup';
    RETURN;
  END IF;

  INSERT INTO account_memberships (account_id, user_id, role, is_active)
  VALUES (v_acct_id, v_user_id, 'OWNER', true)
  ON CONFLICT (account_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = true;
END $$;
