# DoveApp Security Hardening - Deployment Guide

## Quick Start

Follow these steps to deploy the security-hardened multi-portal system:

---

## Step 1: Run Migrations in Supabase

### 1.1 First Migration (Multi-Portal Schema)

Go to your Supabase project → SQL Editor → New Query

**Copy and paste:** `supabase/migrations/037_multi_portal_schema.sql`

This creates:

- `accounts` table
- `users` table
- `account_memberships` table
- `customers` table
- Adds `account_id` columns to existing tables

Click **RUN** ✅

### 1.2 Second Migration (RLS Policies)

In SQL Editor → New Query

**Copy and paste:** `supabase/migrations/038_comprehensive_rls_policies_fixed.sql`

This enables Row Level Security on all tables.

Click **RUN** ✅

---

## Step 2: Create Your First Account

In Supabase SQL Editor, run:

```sql
-- Create your first account
INSERT INTO accounts (name, subdomain)
VALUES ('My Company', 'mycompany')
RETURNING *;

-- Note the account ID that's returned
```

---

## Step 3: Create Admin User

### 3.1 Create Auth User

Go to Supabase → Authentication → Users → **Add User**

- Email: `admin@yourcompany.com`
- Password: (your secure password)
- Auto Confirm User: ✅ YES

### 3.2 Link User to Profile

After creating the auth user, copy their User ID and run:

```sql
-- Replace with your actual user ID from auth.users
INSERT INTO users (id, email, full_name)
VALUES (
  'USER_ID_HERE',  -- Replace with actual UUID from auth.users
  'admin@yourcompany.com',
  'Admin User'
);
```

### 3.3 Create Account Membership

```sql
-- Link user to account as OWNER
-- Replace ACCOUNT_ID and USER_ID with actual values
INSERT INTO account_memberships (account_id, user_id, role, is_active)
VALUES (
  'ACCOUNT_ID_HERE',  -- From Step 2
  'USER_ID_HERE',     -- From Step 3.2
  'OWNER',
  true
);
```

---

## Step 4: Verify Installation

### 4.1 Check Tables Exist

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('accounts', 'users', 'account_memberships', 'customers')
ORDER BY tablename;
```

Should return all 4 tables.

### 4.2 Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
```

Should show 15+ tables with RLS enabled.

### 4.3 Check Your Account

```sql
SELECT
  a.name as account_name,
  u.email,
  am.role,
  am.is_active
FROM accounts a
JOIN account_memberships am ON a.id = am.account_id
JOIN users u ON am.user_id = u.id;
```

Should show your account and membership.

---

## Step 5: Test the Application

### 5.1 Start Development Server

```bash
cd /home/nick/dev/doveapp
npm run dev
```

### 5.2 Login

1. Go to http://localhost:3000/auth/login
2. Login with your admin credentials
3. You should be redirected to `/admin/dashboard`

### 5.3 Verify Security

Try these tests:

**Test 1: Authentication Required**

```bash
# Should return 401 Unauthorized
curl http://localhost:3000/api/clients
```

**Test 2: Login and Access API**

1. Login via browser
2. Open DevTools → Network
3. Copy the session cookie
4. Try API with cookie:

```bash
curl -H "Cookie: sb-access-token=YOUR_TOKEN" http://localhost:3000/api/clients
```

Should return your clients (empty array initially).

---

## Step 6: Create Demo Data (Optional)

### 6.1 Create Test Technician

```sql
-- Create tech user in Supabase Auth Dashboard
-- Then link to profile and membership:

INSERT INTO users (id, email, full_name)
VALUES ('TECH_USER_ID', 'tech@yourcompany.com', 'Tech User');

INSERT INTO account_memberships (account_id, user_id, role, is_active)
VALUES ('YOUR_ACCOUNT_ID', 'TECH_USER_ID', 'TECH', true);
```

### 6.2 Create Test Customer

```sql
INSERT INTO customers (account_id, name, email, phone)
VALUES (
  'YOUR_ACCOUNT_ID',
  'John Smith',
  'john@example.com',
  '555-1234'
);
```

---

## Step 7: Migrate Legacy Data (If You Have Existing Data)

If you already have data in `clients`, `jobs`, `estimates`, `invoices`, or `leads` tables:

### 7.1 Get Your Account ID

```sql
SELECT id, name FROM accounts;
```

### 7.2 Populate account_id Columns

```sql
-- Set your account ID
DO $$
DECLARE
  my_account_id UUID := 'YOUR_ACCOUNT_ID_HERE';
BEGIN
  -- Update jobs
  UPDATE jobs
  SET account_id = my_account_id
  WHERE account_id IS NULL;

  -- Update estimates
  UPDATE estimates
  SET account_id = my_account_id
  WHERE account_id IS NULL;

  -- Update invoices
  UPDATE invoices
  SET account_id = my_account_id
  WHERE account_id IS NULL;

  -- Update leads
  UPDATE leads
  SET account_id = my_account_id
  WHERE account_id IS NULL;

  -- Update time_entries
  UPDATE time_entries
  SET account_id = my_account_id
  WHERE account_id IS NULL;

  RAISE NOTICE 'Legacy data migrated successfully';
END $$;
```

### 7.3 Verify Migration

```sql
-- Check for any remaining NULL account_ids
SELECT
  'jobs' as table_name,
  COUNT(*) as null_count
FROM jobs WHERE account_id IS NULL
UNION ALL
SELECT 'estimates', COUNT(*) FROM estimates WHERE account_id IS NULL
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices WHERE account_id IS NULL
UNION ALL
SELECT 'leads', COUNT(*) FROM leads WHERE account_id IS NULL;
```

Should all return 0.

---

## Step 8: Enable Strict Filtering (Production Only)

Once all data has `account_id` populated, enable strict filtering:

In these files, **uncomment** the account_id filtering:

1. `app/api/clients/route.ts` - Line ~31
2. `app/api/jobs/route.ts` - Line ~39
3. `app/api/estimates/route.ts` - Line ~34
4. `app/api/invoices/route.ts` - Line ~34
5. `app/api/leads/route.ts` - Line ~30

**Before:**

```typescript
// Temporarily allowing records without account_id
// In production: queryBuilder = queryBuilder.eq('account_id', context.accountId);
```

**After:**

```typescript
// Strict account filtering for production
queryBuilder = queryBuilder.eq('account_id', context.accountId);
```

---

## Troubleshooting

### Issue: "column account_id does not exist"

**Solution:** Run migration 037 first, then 038.

### Issue: "relation 'accounts' does not exist"

**Solution:** Run migration 037 in Supabase SQL Editor.

### Issue: Can't login

**Solutions:**

1. Check user was created in Supabase Auth
2. Verify user exists in `users` table
3. Check account membership exists
4. Verify `is_active = true`

### Issue: "No account membership found"

**Solution:**

```sql
-- Verify membership
SELECT * FROM account_memberships WHERE user_id = 'YOUR_USER_ID';

-- If missing, create it:
INSERT INTO account_memberships (account_id, user_id, role, is_active)
VALUES ('ACCOUNT_ID', 'USER_ID', 'OWNER', true);
```

### Issue: API returns empty results

**Solution:**

1. Make sure you're logged in
2. Check that data has `account_id` populated
3. Verify RLS policies allow access

```sql
-- Test RLS as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID';
SELECT * FROM jobs;
```

---

## Production Checklist

Before deploying to production:

- [ ] All migrations run successfully
- [ ] RLS enabled on all tables (verify with query above)
- [ ] Admin user created and can login
- [ ] Legacy data migrated (all account_ids populated)
- [ ] Strict filtering enabled in API routes
- [ ] Environment variables set in Vercel/hosting
- [ ] CORS configured in Supabase for production domain
- [ ] Security headers configured in `next.config.ts`
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and logging set up

---

## Next Steps

1. **Read SECURITY.md** for ongoing security practices
2. **Review SECURITY_AUDIT_RESULTS.md** for what was fixed
3. **Configure backups** in Supabase dashboard
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Enable MFA** for admin users
6. **Plan Redis integration** for production rate limiting

---

## Support

For issues:

1. Check the troubleshooting section above
2. Review migration files for errors
3. Check Supabase logs
4. Verify environment variables

**Security Contact:** Refer to SECURITY.md for incident response procedures.

---

**Status:** ✅ Ready for deployment after following these steps
**Security Level:** Production-ready multi-tenant system
