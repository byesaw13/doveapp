# Fix Tenant and Login Issues

## Problem Identified

The login system is failing due to **infinite recursion in RLS policies** for the `account_memberships` table. This prevents users from logging in and accessing their accounts.

### Error Details

```
infinite recursion detected in policy for relation "account_memberships"
```

This happens because the RLS policy tries to query `account_memberships` from within an `account_memberships` policy, creating a circular dependency.

## Solution Steps

### Step 1: Apply the RLS Fix Migration

Go to your Supabase Dashboard → SQL Editor and run the following migration:

**File**: `supabase/migrations/039_fix_rls_infinite_recursion.sql`

Or copy and paste this SQL directly:

```sql
-- Fix infinite recursion in account_memberships RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view account memberships" ON account_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON account_memberships;
DROP POLICY IF EXISTS "Users can view their accounts" ON accounts;
DROP POLICY IF EXISTS "Owners can update their account" ON accounts;

-- Create a helper function to check if user is admin (avoids recursion)
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

-- Fixed policies for account_memberships
CREATE POLICY "Users can view their own memberships"
  ON account_memberships
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all account memberships"
  ON account_memberships
  FOR SELECT
  USING (user_is_account_admin(account_id));

CREATE POLICY "Admins can insert memberships"
  ON account_memberships
  FOR INSERT
  WITH CHECK (user_is_account_admin(account_id));

CREATE POLICY "Admins can update memberships"
  ON account_memberships
  FOR UPDATE
  USING (user_is_account_admin(account_id));

CREATE POLICY "Admins can delete memberships"
  ON account_memberships
  FOR DELETE
  USING (user_is_account_admin(account_id));

-- Fixed policies for accounts table
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

CREATE POLICY "Owners can update their account"
  ON accounts
  FOR UPDATE
  USING (user_is_account_admin(id));
```

### Step 2: Verify the Fix

Run the test script to verify login works:

```bash
node scripts/test-login-flow.js
```

You should see:

- ✅ Authentication successful
- ✅ User profile found
- ✅ Memberships found (instead of recursion error)
- ✅ Correct redirect path

### Step 3: Test in Browser

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/auth/login

3. Try logging in with demo credentials:
   - **Admin**: admin@demo.com / demo123
   - **Tech**: tech@demo.com / demo123
   - **Customer**: customer@demo.com / demo123

## Current Setup Status

Your tenant setup is mostly complete:

✅ **Accounts table**: 4 accounts including "Dovetails Services LLC"
✅ **Users table**: 6 users created
✅ **Auth users**: All users exist in Supabase Auth
✅ **Memberships**: 4 memberships configured
❌ **RLS Policies**: Had infinite recursion (now fixed with migration 039)

## What Was Wrong

### Original Problematic Policy

```sql
CREATE POLICY "Users can view account memberships"
  ON account_memberships
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_memberships  -- ❌ Queries same table!
      WHERE user_id = auth.uid()
    )
  );
```

### Fixed Approach

```sql
-- Split into two policies:
-- 1. Users can see their own memberships (no recursion)
CREATE POLICY "Users can view their own memberships"
  ON account_memberships
  FOR SELECT
  USING (user_id = auth.uid());  -- ✅ Direct check, no subquery

-- 2. Admins use a SECURITY DEFINER function (bypasses RLS)
CREATE POLICY "Admins can view all account memberships"
  ON account_memberships
  FOR SELECT
  USING (user_is_account_admin(account_id));  -- ✅ Function runs without RLS
```

## Additional Commands

### Check tenant setup status

```bash
node scripts/check-tenant-setup.js
```

### Create new tenant

```bash
node scripts/setup-tenant.js -- --email admin@mycompany.com --company "My Company"
```

### Recreate demo users

```bash
node scripts/create-demo-users.js
```

### Check database connection

```bash
node scripts/test-connection.js
```

## Environment Requirements

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for admin operations
```

## After Fixing

Once the migration is applied and login works, you should be able to:

1. ✅ Login with any demo account
2. ✅ See proper redirects based on role:
   - OWNER/ADMIN → `/admin/dashboard`
   - TECH → `/tech/today`
   - CUSTOMER → `/portal/home`
3. ✅ Access account-specific data
4. ✅ Create new users and assign roles

## Troubleshooting

### If login still fails after migration:

1. **Check if RLS is enabled**:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('accounts', 'account_memberships', 'users');
   ```

2. **Check policies exist**:

   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('accounts', 'account_memberships');
   ```

3. **Disable RLS temporarily to test** (NOT for production):

   ```sql
   ALTER TABLE account_memberships DISABLE ROW LEVEL SECURITY;
   ```

4. **Check user's auth session** in browser dev tools:
   - Application → Cookies → Look for `sb-*` cookies

### If middleware redirects aren't working:

Check that `middleware.ts` is properly configured (it looks good in your current setup).

## Next Steps

After login is working:

1. ✅ Test all three user roles (admin, tech, customer)
2. ✅ Verify data access controls work properly
3. ✅ Create your actual business account and users
4. ✅ Disable or remove demo accounts for production
