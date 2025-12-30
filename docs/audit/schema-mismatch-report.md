# Schema Mismatch Report

## PGRST200 Fix: job_notes.technician_id FK to public.users

- **Description**: PostgREST couldn't join job_notes to users because FK was to auth.users, but app joins to public.users.
- **Evidence**: Error in endpoint, migration 078 added FK to public.users(id).
- **Fix Applied**: Migration 078_job_notes_fk_to_public_users.sql adds FOREIGN KEY to public.users(id).

## Mismatch 2: Invoices customer_id renamed but ensure consistency

- **Description**: Migration 062 renames invoices.customer_id to client_id, but verify no lingering references.
- **Evidence**: Migration 062_rename_invoices_customer_id_to_client_id.sql exists. App uses client_id in jobs and clients.
- **Proposed Fix**: None needed if consistent.

## Mismatch 3: Jobs client_id NOT NULL enforced

- **Description**: Jobs table requires client_id NOT NULL, app inserts set it.
- **Evidence**: Migration for jobs (pre-049) has client_id UUID NOT NULL REFERENCES clients(id). App/api/jobs/route.ts inserts client_id.
- **Proposed Fix**: None.

## Mismatch 4: Status values consistency

- **Description**: Jobs status uses 'completed', app inserts 'completed'.
- **Evidence**: Migration for jobs has status enum including 'completed'. App uses 'completed'.
- **Proposed Fix**: None.
