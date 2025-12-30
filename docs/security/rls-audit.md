# RLS Audit Sweep (MVP Spine)

## Scope

Tenant-owned tables are identified by presence of `account_id` in
`supabase/schema_baseline.sql`. All tables below have RLS enabled.

## Summary

- **RLS enabled** for all account-owned tables.
- **Policies present** for all account-owned tables.
- **Non-standard policies** exist that weaken isolation (allow-all, or missing
  account checks). These should be standardized to `account_id` + membership
  checks.
- **Nullable account_id** appears across multiple tenant tables; this is a
  medium-term risk until backfilled and enforced as NOT NULL.

## Table Status

| Table                  | RLS Enabled | Policies Present | Bypass Policy? | account_id Nullable? | Notes                                                                |
| ---------------------- | ----------- | ---------------- | -------------- | -------------------- | -------------------------------------------------------------------- |
| `account_memberships`  | Yes         | Yes              | No             | No                   | Admin + self-view policies.                                          |
| `clients`              | Yes         | Yes              | Yes            | No                   | Has allow-all and authenticated access (non-standard).               |
| `customers`            | Yes         | Yes              | No             | No                   | Authenticated manage policy lacks account scoping.                   |
| `estimates`            | Yes         | Yes              | No             | Yes                  | Account-member policies allow null account_id.                       |
| `invoices`             | Yes         | Yes              | Yes            | Yes                  | Allow-all policy present.                                            |
| `job_notes`            | Yes         | Yes              | No             | Yes                  | Option A hardening uses account_id claim; tech insert uses job join. |
| `jobs`                 | Yes         | Yes              | Yes            | Yes                  | Allow-all policy present.                                            |
| `leads`                | Yes         | Yes              | No             | Yes                  | Account-member policies allow null account_id.                       |
| `properties`           | Yes         | Yes              | Yes            | Yes                  | Allow-all policy present.                                            |
| `technician_locations` | Yes         | Yes              | No             | Yes                  | Account-member + tech policies.                                      |
| `technician_rates`     | Yes         | Yes              | No             | Yes                  | Account-member + admin policies.                                     |
| `time_approvals`       | Yes         | Yes              | No             | Yes                  | Account-member + tech policies.                                      |
| `time_breaks`          | Yes         | Yes              | No             | Yes                  | Account-member + tech policies.                                      |
| `time_entries`         | Yes         | Yes              | No             | Yes                  | Staff manage policy allows null account_id.                          |
| `visits`               | Yes         | Yes              | No             | No                   | Admin/manage + account-member view policies.                         |

## Standardization Target

Policies should follow:

- `account_id = jwt.account_id` (or equivalent via account membership)
- tech/customer access gated by explicit assignment or customer ownership
- no `USING (true)` or `WITH CHECK (true)` on tenant tables

## Verification Script

`supabase/rls/verify_all_isolation.sql` checks that authenticated users can
only read rows for their account and see zero rows from another account. The
script uses existing memberships to pick two accounts. If fewer than two
accounts exist, it raises an error.

Expected results:

- `*_own` rows: `>= 1` when data exists for the current account
- `*_other` rows: `0`

## job_notes RLS

`job_notes` has an `account_id` column (nullable). The hardening policy uses
`request.jwt.claim.account_id` for tenant scoping and a job join for tech insert
checks. If `account_id` were missing, the policy would require a join against
`jobs.account_id` to enforce tenant isolation.

## Nullable account_id risk

Tables with nullable `account_id` should be backfilled and migrated to NOT NULL
in a future schema change. This audit does not apply schema changes.

## Bypass Policy Summary

- **Bypass policies are not restricted to service_role in the current baseline.**
- MVP spine tables with `USING (true)` / `WITH CHECK (true)` policies:
  - `clients`, `invoices`, `jobs`, `properties`

## Follow-up Recommendations

- Replace allow-all policies (`clients`, `invoices`, `jobs`, `properties`) with
  account-scoped membership checks; ensure any bypass is service_role only.
- Remove `authenticated`-only policies that skip `account_id` filters (e.g.
  `customers`, `time_entries`).
- Remove `account_id IS NULL` fallbacks once legacy data is backfilled.
