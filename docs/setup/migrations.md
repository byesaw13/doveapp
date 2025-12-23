# Migration Standards and Guidelines

## Overview

This document outlines standards for writing safe, maintainable Supabase migrations in the DoveApp project.

## Migration Philosophy

### Baseline-First Approach

- We use a single baseline migration that represents the complete current schema
- All future migrations build incrementally from this baseline
- Legacy migration history is preserved in `supabase/migrations_archive/` for reference

### Safety First

- **Never use destructive operations** in production migrations
- Prefer `ALTER TABLE` over `DROP` + `CREATE`
- Always add defensive checks (`IF EXISTS`, `IF NOT EXISTS`)

## Writing New Migrations

### File Naming

Use timestamp-based naming: `YYYYMMDDHHMMSS_description.sql`

Example: `20241223143000_add_job_priority_field.sql`

### Migration Structure

```sql
-- Brief description of what this migration does
-- Any prerequisites or assumptions

-- Use DO blocks for complex operations
DO $$
BEGIN
    -- Your migration logic here

    -- Always check for existence first
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'jobs' AND column_name = 'priority') THEN
        ALTER TABLE jobs ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;
END $$;

```

### Common Patterns

#### Adding Columns

```sql
-- Safe column addition
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'table_name'
                   AND column_name = 'column_name') THEN

        ALTER TABLE table_name ADD COLUMN column_name data_type;
    END IF;
END $$;
```

#### Adding Tables

```sql
-- Safe table creation
CREATE TABLE IF NOT EXISTS new_table (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- other columns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### RLS Policy Management

```sql
-- Safe policy creation (only if it doesn't exist)
DO $$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_name' AND policyname = 'policy_name') THEN
        CREATE POLICY "policy_description" ON table_name
            FOR SELECT USING (...);
    END IF;
END $$;
```

#### Index Creation

```sql
-- Safe index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_column

    ON table_name(column_name);
```

## Testing Migrations

### Local Testing

Before committing any migration:

1. **Reset your local database**:

   ```bash
   supabase db reset
   ```

2. **Verify the migration applies cleanly**:
   - Check for any errors in the output

   - Confirm expected tables/columns exist
   - Test RLS policies work as expected

3. **Run application tests**:

   ```bash
   npm run test
   npm run test:e2e  # if available

   ```

### CI Integration

Migrations should be validated in CI to ensure they:

- Apply cleanly from scratch

- Don't break existing functionality
- Maintain data integrity

## Migration Categories

### Safe Operations (Always OK)

- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN`
- `CREATE INDEX CONCURRENTLY IF NOT EXISTS`
- `CREATE POLICY ...` (with existence checks)
- `GRANT` statements

### Risky Operations (Use Extreme Caution)

- `DROP TABLE`, `DROP COLUMN` - Never in production
- `TRUNCATE` - Only for development/testing

- `DELETE FROM` without WHERE - Never
- Schema-wide changes - Test thoroughly

### Prohibited Operations

- `DROP SCHEMA` - Never in production migrations
- Raw SQL without existence checks

- Operations that could cause data loss

## Rollback Strategy

### For Development

- Use `supabase db reset` to start fresh
- Keep destructive operations in separate dev-only migrations

### For Production

- Always write reversible migrations when possible
- Document rollback procedures
- Test rollbacks in staging first

## Tools and Scripts

### Available Scripts

- `npm run db:reset` - Reset local database (if configured)
- `npm run db:migrate` - Apply pending migrations
- Manual: `supabase db reset` for full reset

### Migration Validation

```bash
# Check if migrations apply cleanly
supabase db reset


# Verify schema matches expectations
supabase db dump --schema-only > current_schema.sql
```

## Examples

### Good Migration: Adding a Column

```sql
-- Add priority field to jobs table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'jobs' AND column_name = 'priority') THEN
        ALTER TABLE jobs ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
        COMMENT ON COLUMN jobs.priority IS 'Job priority level for scheduling';
    END IF;
END $$;
```

### Bad Migration: Destructive Operation

```sql
-- DON'T DO THIS
DROP TABLE jobs CASCADE;
CREATE TABLE jobs (...);
```

Instead, use incremental changes:

```sql
-- DO THIS INSTEAD
ALTER TABLE jobs ADD COLUMN new_field TEXT;
-- Add more ALTER statements as needed
```

## Contact

For questions about migration standards or help with complex migrations, refer to the team documentation or create an issue with the "migration" label.
