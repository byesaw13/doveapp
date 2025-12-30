-- MVP Spine: Clients RLS and Account Requirements
-- Enable RLS on clients table and add admin management policies

-- Ensure RLS enabled on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;

-- Admin/Owner manage policy
CREATE POLICY "Admins can manage clients"
  ON clients
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id
      FROM account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id
      FROM account_memberships
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
        AND is_active = true
    )
  );