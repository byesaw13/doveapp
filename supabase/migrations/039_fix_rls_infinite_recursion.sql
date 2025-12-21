-- Fix infinite recursion in account_memberships RLS policies
-- The issue: policies were querying account_memberships from within account_memberships policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view account memberships" ON account_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON account_memberships;

-- Create fixed policies that don't cause recursion
-- Users can view memberships where they are the user
CREATE POLICY "Users can view their own memberships"
  ON account_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can view other memberships in accounts where they are OWNER or ADMIN
-- This policy uses a function to avoid recursion
CREATE OR REPLACE FUNCTION user_is_account_admin(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_memberships
    WHERE account_id = account_uuid
    AND user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all account memberships"
  ON account_memberships
  FOR SELECT
  USING (user_is_account_admin(account_id));

-- Only owners and admins can insert memberships
CREATE POLICY "Admins can insert memberships"
  ON account_memberships
  FOR INSERT
  WITH CHECK (user_is_account_admin(account_id));

-- Only owners and admins can update memberships
CREATE POLICY "Admins can update memberships"
  ON account_memberships
  FOR UPDATE
  USING (user_is_account_admin(account_id));

-- Only owners and admins can delete memberships
CREATE POLICY "Admins can delete memberships"
  ON account_memberships
  FOR DELETE
  USING (user_is_account_admin(account_id));

-- Also fix the accounts table policies that had similar issues
DROP POLICY IF EXISTS "Users can view their accounts" ON accounts;
DROP POLICY IF EXISTS "Owners can update their account" ON accounts;

-- Users can view accounts where they have a membership
CREATE POLICY "Users can view their accounts"
  ON accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_memberships am
      WHERE am.account_id = accounts.id
      AND am.user_id = auth.uid()
      AND am.is_active = true
    )
  );

-- Only owners can update account settings
CREATE POLICY "Owners can update their account"
  ON accounts
  FOR UPDATE
  USING (user_is_account_admin(id));
