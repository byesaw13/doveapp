# DoveApp Database Schema Issues & Fix Plan

## 🔴 Critical Issues Identified

### Issue #1: Duplicate `customers` Table Definition

**Affected Migrations**: 033, 037
**Problem**: Two different `customers` table structures are defined

- Migration 033 creates `customers` for messaging (no `account_id`)
- Migration 037 tries to create `customers` for multi-portal (with `account_id`)
- Because of `CREATE TABLE IF NOT EXISTS`, only the first one wins
- Multi-portal code expects `account_id` but it doesn't exist!

### Issue #2: `clients` vs `customers` Table Confusion

**Problem**: System uses both tables for similar purposes

- **Legacy system**: Uses `clients` table
  - jobs.client_id → clients(id)
  - estimates.client_id → clients(id)
  - invoices.customer_id → clients(id) ⚠️ inconsistent naming!
- **Messaging system**: Uses `customers` table
  - conversations.customer_id → customers(id)
  - messages.customer_id → customers(id)

- **Multi-portal system**: Expects `customers` table with account_id
  - But gets the messaging version without account_id!

**Root Cause**: Incomplete migration from `clients` to `customers`

### Issue #3: Missing `account_id` Column in Customers Table

**Problem**: The `customers` table (created by migration 033) is missing the `account_id` column that migration 037 expects to already exist.

**Impact**:

- Multi-tenant isolation impossible for messaging
- Conversations and messages not scoped to accounts
- Security vulnerability - users could see other accounts' data

### Issue #4: Nullable `account_id` Columns

**Problem**: Migration 037 adds `account_id` to various tables but makes them NULLABLE

**Affected Tables**:

- jobs.account_id (NULLABLE)
- estimates.account_id (NULLABLE)
- invoices.account_id (NULLABLE)
- leads.account_id (NULLABLE)
- time_entries.account_id (NULLABLE)

**Impact**:

- Multi-tenant queries won't work (can't filter WHERE account_id = X if it's NULL)
- Existing data has NULL account_id values
- Service layer has TODO comments to enable filtering after backfill

### Issue #5: Inconsistent Customer ID References

**Problem**: Some tables use `customer_id`, others use `client_id` to reference the same entity

**Examples**:

- jobs.client_id → clients(id) ✅
- jobs.customer_id → ??? (added by migration 037, but NULL)
- invoices.customer_id → clients(id) (should be customers?)
- estimates.client_id → clients(id) ✅
- estimates.customer_id → ??? (added by migration 037, but NULL)

## 📋 Recommended Fix Strategy

### Option A: Complete the Migration to `customers` (Recommended)

**Goal**: Standardize on `customers` table with proper multi-tenant support

**Steps**:

1. **Create a new migration: `046_fix_customers_table_conflict.sql`**
   - Drop and recreate `customers` table with correct structure
   - Add `account_id` column (NOT NULL with foreign key)
   - Migrate data from `clients` to `customers`
   - Add foreign key constraints

2. **Create migration: `047_migrate_clients_to_customers.sql`**
   - Copy all data from `clients` to `customers`
   - Update all foreign keys to point to `customers`
   - Add account_id to all customer records
   - Keep `clients` table as deprecated for backward compatibility

3. **Create migration: `048_backfill_account_ids.sql`**
   - Backfill account_id for jobs, estimates, invoices, leads
   - Make account_id NOT NULL after backfill
   - Add foreign key constraints

4. **Create migration: `049_cleanup_deprecated_columns.sql`**
   - Remove duplicate customer_id/client_id columns
   - Standardize on single reference column
   - Update indexes

### Option B: Keep Both Tables Separate (Simpler but messier)

**Goal**: Fix the immediate conflicts without major migration

**Steps**:

1. **Create migration: `046_fix_customers_table.sql`**
   - ALTER TABLE customers ADD COLUMN account_id (handle if exists)
   - ALTER TABLE customers ADD COLUMN user_id (handle if exists)
   - Rename full_name to name if needed
   - Add missing address columns

2. **Create migration: `047_add_clients_account_id.sql`**
   - ALTER TABLE clients ADD COLUMN account_id
   - Backfill account_id for existing clients
   - Make NOT NULL after backfill

3. **Keep both tables** but with clear purposes:
   - `clients` = Legacy business clients (for jobs, estimates, invoices)
   - `customers` = Messaging/portal customers (for conversations, messages)

## 🎯 Immediate Action Items

### Quick Fixes Needed Now:

1. **Fix the duplicate customers table**

   ```sql
   -- Migration 046_fix_customers_table_schema.sql

   -- Add missing columns to customers table (created by migration 033)
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line1 TEXT;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line2 TEXT;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
   ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;

   -- Rename full_name to name for consistency
   ALTER TABLE customers RENAME COLUMN full_name TO name;
   ```

2. **Add account_id to clients table**

   ```sql
   -- Migration 047_add_clients_account_id.sql

   ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

   -- Create index for multi-tenant queries
   CREATE INDEX IF NOT EXISTS clients_account_id_idx ON clients(account_id);
   ```

3. **Backfill account_id values**

   ```sql
   -- Migration 048_backfill_missing_account_ids.sql

   -- You'll need to determine which account owns existing data
   -- Option 1: Create a default account and assign all data to it
   -- Option 2: Use user-based logic to assign accounts
   -- Option 3: Manual assignment
   ```

4. **Update service layer code**
   - Enable the commented-out account_id filters in `lib/api/*.ts`
   - Update queries to always filter by account_id

## 🔍 Database State Check Commands

Run these to check current state:

```sql
-- Check if customers table has account_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Check if clients table has account_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Check jobs foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'jobs' AND tc.constraint_type = 'FOREIGN KEY';

-- Check for NULL account_ids
SELECT 'jobs' as table_name, COUNT(*) as null_count FROM jobs WHERE account_id IS NULL
UNION ALL
SELECT 'clients', COUNT(*) FROM clients WHERE account_id IS NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE account_id IS NULL
UNION ALL
SELECT 'estimates', COUNT(*) FROM estimates WHERE account_id IS NULL
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices WHERE account_id IS NULL;
```

## ⚠️ Why This Matters

These schema issues are causing:

1. **API Errors**: Multi-portal endpoints failing because account_id is NULL
2. **Security Risks**: No multi-tenant isolation means data leakage possible
3. **Data Integrity**: Inconsistent foreign key references
4. **Code Confusion**: Developers don't know whether to use clients or customers
5. **Migration Failures**: Future migrations may fail due to schema inconsistencies

## 📝 Next Steps

1. **Choose a strategy** (A or B above)
2. **Back up your database** before making changes
3. **Create and test migrations** in a development environment first
4. **Run migrations** on production with a maintenance window
5. **Update application code** to use correct table references
6. **Enable account_id filtering** in service layer
7. **Test thoroughly** across all three portals

---

**Created**: 2025-12-15
**Priority**: 🔴 CRITICAL
**Impact**: All portals, multi-tenancy, data security
