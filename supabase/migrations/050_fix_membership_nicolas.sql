-- Ensure Nicolas Garon is linked to Dovetails Services LLC as OWNER
DO $$
DECLARE
  v_acct_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_acct_id FROM accounts WHERE name = 'Dovetails Services LLC' LIMIT 1;
  IF v_acct_id IS NULL THEN
    RAISE EXCEPTION 'Account "Dovetails Services LLC" not found';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE email = 'nicolasgaron@mydovetails.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User "nicolasgaron@mydovetails.com" not found';
  END IF;

  INSERT INTO account_memberships (account_id, user_id, role, is_active)
  VALUES (v_acct_id, v_user_id, 'OWNER', true)
  ON CONFLICT (account_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = true;
END $$;
