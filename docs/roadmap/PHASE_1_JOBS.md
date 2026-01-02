# Phase 1 Jobs Lifecycle Verification

## Preconditions

- Local Supabase instance running (`npx supabase start`)
- Database migrations applied (latest)
- Node.js environment with npm installed

## Commands

```bash
# Reset database to ensure clean state
npx supabase db reset --local

# Check for any boundary violations (if script exists)
npm run check:boundaries
```

## API Smoke Tests

Use tools like curl, Postman, or browser dev tools to test endpoints.

### Status Update

```bash
# Replace {job_id} with a valid UUID from jobs table
# Replace {account_id} with valid account_id
curl -X POST http://localhost:3000/api/jobs/{job_id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid_token}" \
  -d '{"status": "in_progress", "reason": "Starting work"}'
```

Expected: 200 OK with JSON `{ "success": true, "job": {...}, "audit_note_id": "uuid" }`

### Timeline Fetch

```bash
# Replace {job_id} with same valid UUID
curl -X GET http://localhost:3000/api/jobs/{job_id}/timeline \
  -H "Authorization: Bearer {valid_token}"
```

Expected: 200 OK with JSON `{ "job_id": "uuid", "account_id": "uuid", "items": [...] }`

## SQL Checks

Run these in Supabase SQL Editor or psql.

```sql
-- Check job status distribution (should include new statuses)
SELECT status, COUNT(*) FROM jobs GROUP BY status;
-- Expected: Rows with statuses like 'quote', 'scheduled', etc.

-- Check audit notes exist
SELECT COUNT(*) FROM job_notes;
-- Expected: > 0 if any jobs exist

-- Verify new column exists
SELECT status_changed_at FROM jobs LIMIT 1;
-- Expected: Column exists, may be NULL or have default value
```

## Expected Results

- Database reset completes without errors
- API calls return 200 with valid JSON responses
- SQL queries return data showing schema is correct
- No regressions in job lifecycle functionality
