# Portal API Cleanup & Legacy App Deprecation

## Current Risks
- Legacy single-app UI still lives under `app/(main)` and admin/tech routes (e.g. `app/admin/jobs/page.tsx`) redirect back to it.
- Most APIs are shared (`/api/jobs`, `/api/clients`, `/api/estimates`, etc.) with account filters commented out, so portal RBAC depends on UI conventions instead of the API boundary.
- Portal coverage is thin (`/api/tech/today-jobs`, `/api/portal/upcoming-jobs` are the only portal-specific endpoints), so the new portals cannot run independently.
- Middleware/layouts already expect portal role separation, but API responses are not scoped per portal, leaving room for cross-portal data leakage and inconsistent UX.

## Goals
- Portal-aware API boundaries (`admin`, `tech`, `customer`) with explicit RBAC and enforced `account_id`.
- Remove dependencies on the legacy `app/(main)` UI and stop redirecting to it from portal pages.
- Provide a controlled, measurable deprecation path for the single-app routes and legacy APIs.

## Phased Plan
1) **Baseline inventory**
   - Map every API route to an owning portal and intended consumer.
   - Trace frontend usage (search for `fetch('/api/` and `axios.*('/api/`) to confirm callsites).
   - Flag legacy redirects to `app/(main)` (admin/tech pages that `redirect('/jobs')`, etc.).
2) **API namespacing + enforcement**
   - Stand up portal-specific namespaces: `/api/admin/*`, `/api/tech/*`, `/api/portal/*` using `requireAdminContext`, `requireTechContext`, `requireCustomerContext`.
   - Move existing logic into shared service modules under `lib/api/` and expose thin wrappers per portal.
   - Turn on `account_id` filters in core endpoints (`/api/jobs`, `/api/clients`, `/api/estimates`, `/api/invoices`, `/api/materials`, `/api/leads`, `/api/kpi`) after backfilling null `account_id` rows.
   - Add `Deprecation` + `Link` headers on legacy endpoints to point to the portal-specific replacements.
   - Implementation notes:
     - Create `lib/api/jobs.ts`, `lib/api/clients.ts`, `lib/api/estimates.ts`, `lib/api/invoices.ts`, `lib/api/materials.ts`, `lib/api/leads.ts`, `lib/api/kpi.ts` with pure functions that accept `{ accountId, userId, role }` and optional filters; keep DB logic there.
     - Mirror route stubs:
       - `/api/admin/jobs` (full CRUD; admin guard) → calls `lib/api/jobs` with admin permission and `account_id` enforced.
       - `/api/tech/jobs` (read-only, assigned to tech; tech guard) → calls `lib/api/jobs` scoped to `assigned_tech_id = userId`.
       - `/api/portal/jobs` (read-only, customer; customer guard) → calls `lib/api/jobs` scoped to `customer_id`/`account_id`.
       - Repeat pattern for clients, estimates, invoices, materials (admin only), leads (admin only), kpi (admin only).
     - Turn on `account_id` filters in legacy shared endpoints **after** backfill; add a temporary feature flag `ENABLE_ACCOUNT_FILTERS` if needed for staged rollout.
     - Add headers on legacy endpoints:
       - `Deprecation: version=\"1\"` + `Link: </api/admin/jobs>; rel=\"successor-version\"` (adjust per endpoint).
       - Include `Sunset` date once portal endpoints are live.
     - Update middleware matcher to include new namespaces (`/api/admin/:path*`, `/api/tech/:path*`, `/api/portal/:path*`) and ensure headers `x-account-id`, `x-user-role`, `x-user-id` flow through.
     - Add basic integration tests per portal namespace: 401 without auth, 403 wrong role, 200 with correct role + account scoping assertion.
3) **Frontend migration**
   - Update admin/tech pages to consume the new portal APIs instead of redirecting to `/jobs`/`/clients` in `app/(main)`.
   - Wire customer portal pages (`/portal/home`, `/portal/upcoming`, `/portal/history`, `/portal/estimates`, `/portal/invoices`) to `/api/portal/*` endpoints for jobs, estimates, invoices, and payments.
   - Standardize response DTOs per portal (tech: assigned jobs; admin: full CRUD; customer: read-only, customer-scoped).
   - Implementation notes:
     - Replace `app/admin/jobs/page.tsx` and `app/admin/customers/page.tsx` redirects with real pages that call `/api/admin/jobs` and `/api/admin/clients`. Use server components that fetch on the server for SSR and pass data to client components.
     - Tech portal: update `app/tech/today` and future tech pages to use `/api/tech/jobs` (assigned-only) plus `/api/tech/today-jobs` for the daily view. Provide a shared `useTechJobs` hook that hydrates from server data to avoid double fetching.
     - Customer portal: add data-fetching helpers for `portal` endpoints (`/api/portal/jobs`, `/api/portal/estimates`, `/api/portal/invoices`, `/api/portal/payments`) and swap the current static UI blocks to live data. Ensure `customer_id` is passed from URL/search params and validated in the API.
     - DTO standardization:
       - Admin: full entity with financials and line items.
       - Tech: only jobs assigned to the tech; include customer contact and service location; hide invoices/estimates totals unless required for workflow.
       - Customer: only their jobs/estimates/invoices; redact internal notes, cost breakdowns if not intended for customer view.
     - Incremental rollout: start by swapping fetch calls in existing components (e.g., replace `/api/jobs` calls in portal pages with the new namespaced endpoints) while leaving legacy endpoints in place with deprecation headers.
4) **Legacy app shutdown**
   - Gate `app/(main)` behind an env flag (`ENABLE_LEGACY_APP=false` by default) and middleware redirect to portal home based on role.
   - Add analytics/logging on legacy route hits to know when traffic reaches zero.
   - Remove legacy pages and styling once traffic is gone.
5) **QA + hardening**
   - Add integration tests per portal API (auth + account scoping assertions).
   - Add smoke tests for portal UIs to ensure they function without `app/(main)`.
   - Document migration steps in `DEPLOYMENT_GUIDE.md` (data backfill + flag rollout).
   - Implementation notes:
     - API tests: for each portal namespace (`/api/admin/*`, `/api/tech/*`, `/api/portal/*`), add Jest/Supertest suites that assert 401 (no auth), 403 (wrong role), 200 (correct role) and that results are scoped to `account_id` and role-specific filters (e.g., tech only sees assigned jobs).
     - UI smoke: add Playwright/Cypress smoke flows for each portal to ensure navigation, list rendering, and detail views work with legacy app disabled (`ENABLE_LEGACY_APP=false`).
     - Fixtures: create seeded Supabase fixtures for an owner/admin, a tech, and a customer with one account and sample jobs/estimates/invoices so tests are deterministic.
     - Tooling: wire tests into CI (`npm run test:portal-apis`, `npm run test:portal-ui`) and make them required before flipping off the legacy app flag.
     - Docs: add a short migration/testing checklist to `DEPLOYMENT_GUIDE.md` that covers data backfill, flag rollout, and test commands to run.

## Baseline Inventory (Jan 2025 snapshot)
- **Portal-specific APIs (thin):** `/api/admin/users` (admin only), `/api/tech/today-jobs` (tech), `/api/portal/upcoming-jobs` (customer). Everything else is shared and assumes UI-level role enforcement.
- **Shared core APIs still tied to legacy app:** `/api/jobs`, `/api/clients`, `/api/estimates`, `/api/invoices`, `/api/leads`, `/api/kpi`, `/api/materials`, `/api/time-tracking`, `/api/automation(s)`, `/api/dashboard/stats`, `/api/sidebar/*`, `/api/push-subscription`, `/api/ai-*`, `/api/email/*`, `/api/square/*`, `/api/inbox/*`, `/api/backup`, `/api/tools`, `/api/job-templates`, `/api/settings`. These are consumed from `app/(main)` components and do not enforce portal-specific DTOs; several have `account_id` filters commented out.
- **Frontend callsites (sampled by `fetch('/api/` search):**
  - `components/ai-estimate-generator.tsx` → `/api/ai-estimates`, `/api/estimates`
  - `components/quick-add-job.tsx` → `/api/clients`, `/api/jobs`
  - `components/admin/CreateUserForm.tsx` → `/api/admin/users`
  - `components/admin/AdminClockBanner.tsx` → `/api/time-tracking`
  - `components/PWARegistration.tsx` → `/api/push-subscription`
  - `components/quick-add-lead.tsx` → `/api/leads`
  - (No axios usage detected in codebase)
- **Legacy redirects back to `app/(main)`:**
  - `app/admin/jobs/page.tsx` → `redirect('/jobs')`
  - `app/admin/customers/page.tsx` → `redirect('/clients')`
- **Portal UI coverage gaps:** Customer portal only calls `/api/portal/upcoming-jobs`; tech portal only calls `/api/tech/today-jobs`. Admin portal pages rely on legacy shared APIs rather than admin-scoped endpoints.

## Quick Wins (next 3–5 days)
- Enable `account_id` filtering in `/api/clients` and `/api/jobs` once data is backfilled; mirror the change across other CRUD endpoints.
- Build `/api/admin/jobs` and `/api/tech/jobs` wrappers that call shared job services, then point portal pages to them.
- Add `Deprecation` headers on legacy `/api/jobs`, `/api/clients`, `/api/estimates` to start surfacing warnings.
- Replace admin/tech redirects to `/jobs` with real portal screens backed by the new endpoints.

## Migration Order (safe rollout)
1. Data prep: backfill `account_id` on legacy rows; verify with `scripts/check-tenant-setup.js`.
2. Ship portal API wrappers + headers (legacy endpoints still work).
3. Flip portal UIs to new endpoints; monitor errors and logs.
4. Disable legacy UI via env flag; monitor traffic.
5. Remove legacy routes + code after a no-traffic window.
