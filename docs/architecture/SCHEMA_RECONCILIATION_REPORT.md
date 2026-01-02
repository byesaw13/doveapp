# Schema Reconciliation Report

## Drift Summary

- Unexpected in DB (baseline but missing from migrations): 9 tables
- Missing in DB (migrations but absent in baseline): 6 tables

## Codified Into New Migration

The following tables were added under migration control in:
`supabase/migrations/20250118000000_reconcile_unexpected_tables.sql`

- public.activity_log
- public.alerts
- public.billing_events
- public.email_insights
- public.email_lead_details
- public.emails_raw
- public.estimate_templates
- public.estimates
- public.job_photos

Each table is created with `IF NOT EXISTS`, has RLS enabled, minimal policies, and indexes for `account_id` and key foreign keys where present.

## Missing in Baseline (Expected by Existing Migrations)

The following tables already have migrations and were verified present in `supabase/migrations/` with chronological ordering:

- public.contact_requests
- public.invoice_reminders
- public.job_checklist_items
- public.team_assignments
- public.team_availability
- public.team_schedules

No changes were made to those migrations.

## TBD / Open Items

- `public.estimate_templates` has no `account_id` or `created_by` column; policies are limited to authenticated read and service_role manage to avoid cross-tenant writes.
- `public.activity_log` has no `account_id`; tenant scoping uses membership against the actor's account.
- Review whether any of the unexpected tables should be scoped differently or gain `account_id` in a future migration.

## Next Steps

1. Apply the new migration.
2. Re-run `npx supabase db dump --linked --schema public --file supabase/schema_baseline.sql`.
3. Re-run the drift report generation to confirm zero unexpected tables.
