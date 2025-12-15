# Portal API Implementation Status

## Overview

This document tracks the implementation progress of the Portal API Cleanup & Legacy App Deprecation plan.

**Last Updated:** Dec 13, 2025  
**Status:** Phase 2 (API Namespacing) - 6/11 tasks complete

---

## ✅ Phase 1: Baseline Inventory - COMPLETE

### Completed Tasks

- ✅ Mapped all API routes to owning portals
- ✅ Traced frontend usage (`fetch('/api/` callsites)
- ✅ Identified legacy redirects in admin/tech pages
- ✅ Documented portal coverage gaps

### Key Findings

**Portal-specific APIs (thin coverage):**

- `/api/admin/users` - Admin only
- `/api/tech/today-jobs` - Tech only
- `/api/portal/upcoming-jobs` - Customer only

**Shared core APIs (legacy):**

- `/api/jobs`, `/api/clients`, `/api/estimates`, `/api/invoices`
- `/api/leads`, `/api/kpi`, `/api/materials`, `/api/time-tracking`
- All have `account_id` filters commented out

**Legacy redirects:**

- `app/admin/jobs/page.tsx` → `redirect('/jobs')`
- `app/admin/customers/page.tsx` → `redirect('/clients')`

---

## ✅ Phase 2: API Namespacing + Enforcement - IN PROGRESS

### ✅ Account ID Verification - COMPLETE

**Status:** Columns exist, nullable, ready for backfill

**Tables with `account_id`:**

- ✅ `jobs` - Added in migration 037
- ✅ `estimates` - Added in migration 037
- ✅ `invoices` - Added in migration 037
- ✅ `leads` - Added in migration 037
- ✅ `time_entries` - Added in migration 037
- ✅ `time_breaks` - Added in migration 041
- ✅ `time_approvals` - Added in migration 041
- ✅ `technician_locations` - Added in migration 041
- ✅ `technician_rates` - Added in migration 041

**Missing `account_id`:**

- ⚠️ `clients` table - Needs migration

**Next Steps:**

1. Create migration to add `account_id` to `clients` table
2. Backfill existing data with account associations
3. Uncomment `account_id` filters in service modules (search for `TODO: Enable after backfill`)

---

### ✅ Shared Service Modules - COMPLETE

Created portal-agnostic service layer in `lib/api/`:

#### `lib/api/jobs.ts`

- `listJobs(context, filters)` - List with role-based filtering
- `getJobById(context, jobId)` - Single job with access control
- `createJob(context, jobData)` - Admin/tech only
- `updateJob(context, jobId, updates)` - Admin/tech with ownership checks
- `deleteJob(context, jobId)` - Admin only

**Access Control:**

- ADMIN: Full CRUD on all account jobs
- TECH: Read/update only assigned jobs
- CUSTOMER: Read-only own jobs

#### `lib/api/clients.ts`

- `listClients(context, filters)` - Admin/tech only
- `getClientById(context, clientId)` - Admin/tech only
- `createClient(context, clientData)` - Admin only
- `updateClient(context, clientId, updates)` - Admin only
- `deleteClient(context, clientId)` - Admin only

#### `lib/api/estimates.ts`

- `listEstimates(context, filters)` - Role-based filtering
- `getEstimateById(context, estimateId)` - Access control
- `createEstimate(context, estimateData)` - Admin only
- `updateEstimate(context, estimateId, updates)` - Admin + customer approve/decline
- `deleteEstimate(context, estimateId)` - Admin only

**Special Logic:**

- Customers can update `status` to `approved` or `declined` on their own estimates

#### `lib/api/invoices.ts`

- `listInvoices(context, filters)` - Role-based filtering
- `getInvoiceById(context, invoiceId)` - Access control
- `createInvoice(context, invoiceData)` - Admin only
- `updateInvoice(context, invoiceId, updates)` - Admin only
- `deleteInvoice(context, invoiceId)` - Admin only

**Common Patterns:**

- All services accept `ServiceContext { accountId, userId, role, supabase }`
- Return `{ data, error }` objects
- Account scoping ready (TODO markers for backfill)
- Consistent error messages

---

### ✅ Portal-Specific API Wrappers - COMPLETE

Built namespaced REST endpoints for each portal:

#### Admin Portal - `/api/admin/jobs`

**Full CRUD access to all account jobs**

```
GET    /api/admin/jobs              - List all jobs (with filters)
POST   /api/admin/jobs              - Create new job
GET    /api/admin/jobs/[id]         - Get single job
PATCH  /api/admin/jobs/[id]         - Update job
DELETE /api/admin/jobs/[id]         - Delete job
```

**Query Params:**

- `?client_id=X` - Filter by client
- `?status=scheduled|in_progress|completed` - Filter by status
- `?search=term` - Search title/description
- `?assigned_tech_id=X` - Filter by assigned tech

**Implementation:** `app/api/admin/jobs/route.ts`, `app/api/admin/jobs/[id]/route.ts`

---

#### Tech Portal - `/api/tech/jobs`

**Read + limited update access to assigned jobs only**

```
GET   /api/tech/jobs              - List jobs assigned to tech
GET   /api/tech/jobs/[id]         - Get assigned job
PATCH /api/tech/jobs/[id]         - Update status/notes (limited fields)
```

**Auto-filtered:**

- Always filtered by `assigned_tech_id = context.userId`
- Cannot see jobs not assigned to them

**Allowed Updates:**

- `status` - Job status changes
- `notes` - Client-visible notes
- `internal_notes` - Internal tech notes

**Implementation:** `app/api/tech/jobs/route.ts`, `app/api/tech/jobs/[id]/route.ts`

---

#### Customer Portal - `/api/portal/jobs`

**Read-only access to customer's own jobs**

```
GET /api/portal/jobs?customer_id=X  - List customer's jobs
GET /api/portal/jobs/[id]           - Get single job (redacted)
```

**Required Param:**

- `?customer_id=X` - Must be provided and match authenticated user

**Response DTO (redacted fields):**

```typescript
{
  (id,
    job_number,
    title,
    description,
    status,
    service_date,
    scheduled_time,
    total,
    created_at,
    updated_at);
  // OMITTED: internal_notes, subtotal, tax,
  //          cost breakdowns, assigned_tech_id
}
```

**Implementation:** `app/api/portal/jobs/route.ts`, `app/api/portal/jobs/[id]/route.ts`

---

### ✅ Deprecation Headers - COMPLETE

Added to legacy `/api/jobs` endpoint:

```http
Deprecation: version="1"
Link: </api/admin/jobs>; rel="successor-version"
Sunset: Mon, 31 Mar 2025 23:59:59 GMT
```

**Next:**

- Add same headers to `/api/clients`, `/api/estimates`, `/api/invoices`
- Monitor traffic to track migration progress
- Create dashboard to visualize legacy endpoint usage

---

### ✅ Middleware Update - COMPLETE

**Current Implementation:** middleware.ts:171-192

Middleware already correctly configured with:

- ✅ All portal paths (`/admin`, `/tech`, `/portal`)
- ✅ All new API namespaces (`/api/admin/*`, `/api/tech/*`, `/api/portal/*`)
- ✅ Legacy API paths for backward compatibility
- ✅ Correct Next.js pattern: `NextResponse.next({ request: { headers } })`

**Matcher includes:**

```javascript
[
  '/admin/:path*',
  '/tech/:path*',
  '/portal/:path*',
  '/api/admin/:path*',
  '/api/tech/:path*',
  '/api/portal/:path*',
  // ... legacy paths
];
```

**Headers set:**

- `x-account-id` - User's primary account
- `x-user-role` - OWNER | ADMIN | TECH | CUSTOMER
- `x-user-id` - Authenticated user ID

---

## 🚧 Phase 3: Frontend Migration - PENDING

### ⏳ Task 7: Replace Admin/Tech Page Redirects

**Current State:**

- `app/admin/jobs/page.tsx` redirects to `/jobs` (legacy)
- `app/admin/customers/page.tsx` redirects to `/clients` (legacy)

**Action Items:**

1. Create real admin pages that call `/api/admin/jobs` and `/api/admin/clients`
2. Use Server Components to fetch on server (SSR)
3. Pass data to client components for interactivity
4. Provide shared hooks (`useAdminJobs`) for client-side data fetching

**Example Implementation:**

```typescript
// app/admin/jobs/page.tsx (new)
export default async function AdminJobsPage() {
  const jobs = await fetch('/api/admin/jobs', { cache: 'no-store' })
  return <JobsTable initialData={jobs} />
}
```

---

### ⏳ Task 8: Wire Customer Portal Pages

**Current State:**

- Customer portal calls `/api/portal/upcoming-jobs` only
- Most portal UI is static placeholders

**Action Items:**

1. Replace static blocks with live data from `/api/portal/*`
2. Add data-fetching helpers for portal endpoints
3. Ensure `customer_id` passed from URL/search params
4. Implement proper loading states and error handling

**Portal Pages to Update:**

- `/portal/home` - Dashboard with upcoming jobs
- `/portal/upcoming` - Upcoming jobs list
- `/portal/history` - Completed jobs
- `/portal/estimates` - Customer estimates (approve/decline)
- `/portal/invoices` - Customer invoices (view/pay)

---

### ⏳ Task 9: Integration Tests

**Test Coverage Needed:**

**API Auth Tests:**

```typescript
describe('/api/admin/jobs', () => {
  test('returns 401 without auth', async () => {
    const res = await fetch('/api/admin/jobs');
    expect(res.status).toBe(401);
  });

  test('returns 403 for tech role', async () => {
    const res = await fetch('/api/admin/jobs', {
      headers: { 'x-user-role': 'TECH' },
    });
    expect(res.status).toBe(403);
  });

  test('returns 200 for admin role', async () => {
    const res = await fetch('/api/admin/jobs', {
      headers: { 'x-user-role': 'ADMIN', 'x-account-id': 'test-account' },
    });
    expect(res.status).toBe(200);
  });
});
```

**Account Scoping Tests:**

```typescript
test('techs only see assigned jobs', async () => {
  const jobs = await fetch('/api/tech/jobs', {
    headers: { 'x-user-id': 'tech-123' },
  }).then((r) => r.json());

  jobs.forEach((job) => {
    expect(job.assigned_tech_id).toBe('tech-123');
  });
});
```

**Test Tooling:**

- Use Jest + Supertest for API tests
- Create seeded Supabase fixtures
- Add to CI pipeline (`npm run test:portal-apis`)

---

### ⏳ Task 10: UI Smoke Tests

**Playwright/Cypress Flows:**

1. **Admin Portal Flow:**
   - Login as admin
   - Navigate to `/admin/jobs`
   - Verify jobs list renders
   - Create new job
   - Verify job appears in list

2. **Tech Portal Flow:**
   - Login as tech
   - Navigate to `/tech/today`
   - Verify only assigned jobs visible
   - Update job status
   - Verify update persists

3. **Customer Portal Flow:**
   - Login as customer
   - Navigate to `/portal/upcoming`
   - Verify own jobs visible
   - View estimate
   - Approve estimate

**Tooling:**

- Add Playwright config (`npm run test:portal-ui`)
- Run with `ENABLE_LEGACY_APP=false` to verify independence
- Make required in CI before legacy app shutdown

---

### ⏳ Task 11: Documentation

**Update DEPLOYMENT_GUIDE.md:**

Add section "Portal API Migration" with:

1. Data backfill steps

   ```sql
   -- Backfill account_id on jobs
   UPDATE jobs SET account_id = (
     SELECT account_id FROM clients WHERE clients.id = jobs.client_id
   ) WHERE account_id IS NULL;
   ```

2. Feature flag rollout

   ```bash
   # Enable account filters
   ENABLE_ACCOUNT_FILTERS=true

   # Disable legacy app
   ENABLE_LEGACY_APP=false
   ```

3. Test commands

   ```bash
   npm run test:portal-apis
   npm run test:portal-ui
   npm run lint
   npm run type-check
   ```

4. Monitoring checklist
   - Check deprecation header logs
   - Monitor 403/404 errors on portal APIs
   - Track legacy endpoint traffic to zero

---

## 📊 Progress Summary

| Phase              | Tasks  | Complete | Pending | Status  |
| ------------------ | ------ | -------- | ------- | ------- |
| Phase 1: Baseline  | 1      | 1        | 0       | ✅ DONE |
| Phase 2: API Layer | 5      | 5        | 0       | ✅ DONE |
| Phase 3: Frontend  | 5      | 0        | 5       | 🚧 TODO |
| **Total**          | **11** | **6**    | **5**   | **55%** |

---

## 🎯 Quick Wins Available Now

1. **Enable account filtering** - Uncomment TODO lines once backfill complete
2. **Frontend can migrate** - New endpoints ready to use
3. **Monitor deprecation** - Track legacy endpoint hits in logs

---

## 🚀 Architecture Benefits Delivered

✅ **Clear separation** - Each portal has its own API namespace  
✅ **Enforced RBAC** - Role checks at service layer  
✅ **Account scoping ready** - TODO markers for backfill  
✅ **Type-safe DTOs** - Different responses per portal  
✅ **Easy testing** - Pure service functions  
✅ **Graceful migration** - Legacy endpoints still work with warnings

---

## 📁 Files Created

### Shared Services

- `lib/api/jobs.ts` - Job service layer
- `lib/api/clients.ts` - Client service layer
- `lib/api/estimates.ts` - Estimate service layer
- `lib/api/invoices.ts` - Invoice service layer

### Admin API

- `app/api/admin/jobs/route.ts` - Admin job list/create
- `app/api/admin/jobs/[id]/route.ts` - Admin job get/update/delete

### Tech API

- `app/api/tech/jobs/route.ts` - Tech job list
- `app/api/tech/jobs/[id]/route.ts` - Tech job get/update

### Customer API

- `app/api/portal/jobs/route.ts` - Customer job list
- `app/api/portal/jobs/[id]/route.ts` - Customer job get

### Documentation

- `docs/portal-api-implementation-status.md` (this file)

---

## 🔗 References

- [Portal API Deprecation Plan](../portal-api-deprecation-plan.md)
- [AGENTS.md Development Guide](../AGENTS.md)
- [Middleware Best Practices](https://nextjs.org/docs/app/building-your-application/routing/middleware)
