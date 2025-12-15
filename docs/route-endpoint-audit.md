# Route-to-Endpoint Audit

This document audits all routes in the three portals (Admin, Tech, Customer) to ensure complete wiring between pages and endpoints.

## Admin Portal (/admin/\*)

### /admin/dashboard

- **Data needed**: Total stats (clients, jobs, properties), recent jobs, estimates, invoices
- **Endpoints called**:
  - `/api/dashboard/stats` (for totals)
  - `/api/admin/jobs` (for recent jobs?)
  - `/api/admin/estimates` (for pending estimates?)
  - `/api/admin/invoices` (for unpaid invoices?)
- **Status**: ⚠️ Partial - stats endpoint exists, but may need list endpoints
- **Fix required**: Ensure dashboard loads data properly

### /admin/schedule

- **Data needed**: Calendar events, jobs with dates
- **Endpoints called**:
  - `/api/admin/jobs` (with date filters)
- **Status**: ⚠️ Stub - depends on jobs endpoint
- **Fix required**: Ensure date filtering works

### /admin/clients

- **Data needed**: List of clients, with filtering/search
- **Endpoints called**:
  - `/api/admin/clients`
- **Status**: ✅ Wired - endpoint exists
- **Fix required**: None

### /admin/jobs

- **Data needed**: List of jobs, with filters
- **Endpoints called**:
  - `/api/admin/jobs`
- **Status**: ✅ Wired - endpoint exists
- **Fix required**: None

### /admin/estimates

- **Data needed**: List of estimates, with filters
- **Endpoints called**:
  - `/api/admin/estimates`
- **Status**: ✅ Wired - endpoint exists
- **Fix required**: None

### /admin/invoices

- **Data needed**: List of invoices, with filters
- **Endpoints called**:
  - `/api/admin/invoices`
- **Status**: ✅ Wired - endpoint exists
- **Fix required**: None

### /admin/leads

- **Data needed**: List of leads
- **Endpoints called**:
  - `/api/admin/leads`
- **Status**: ⚠️ Stub - check if endpoint exists
- **Fix required**: Verify endpoint

### /admin/kpi

- **Data needed**: KPI metrics, charts
- **Endpoints called**:
  - `/api/admin/kpi`
- **Status**: ❌ Missing - no endpoint found
- **Fix required**: Implement KPI endpoint

### /admin/inventory

- **Data needed**: Inventory items, materials
- **Endpoints called**:
  - `/api/admin/inventory` or `/api/inventory`
- **Status**: ⚠️ Stub - check endpoints
- **Fix required**: Verify and implement

### /admin/time-tracking

- **Data needed**: Time entries, reports
- **Endpoints called**:
  - `/api/admin/time-tracking`
- **Status**: ⚠️ Stub - check if exists
- **Fix required**: Verify

### /admin/settings

- **Data needed**: Business settings
- **Endpoints called**:
  - `/api/admin/settings`
- **Status**: ⚠️ Stub - check
- **Fix required**: Verify

### /admin/automations

- **Data needed**: Automation rules
- **Endpoints called**:
  - `/api/admin/automations`
- **Status**: ⚠️ Stub - check
- **Fix required**: Verify

### /admin/help

- **Data needed**: Static help content
- **Endpoints called**: None
- **Status**: ✅ Wired
- **Fix required**: None

### /admin/debug

- **Data needed**: Debug info
- **Endpoints called**: None or debug endpoints
- **Status**: ⚠️ Stub
- **Fix required**: Verify

### /admin/email-review

- **Data needed**: Email reviews
- **Endpoints called**: None or email endpoints
- **Status**: ⚠️ Stub
- **Fix required**: Verify

### /admin/pricebook/inspector

- **Data needed**: Pricebook data
- **Endpoints called**: Pricebook endpoints
- **Status**: ⚠️ Stub
- **Fix required**: Verify

## Tech Portal (/tech/\*)

### /tech/today

- **Data needed**: Today's jobs for the tech
- **Endpoints called**:
  - `/api/tech/today-jobs`
- **Status**: ⚠️ Stub - check if exists
- **Fix required**: Implement if missing

## Customer Portal (/portal/\*)

### /portal/home

- **Data needed**: Customer's upcoming jobs, estimates, invoices
- **Endpoints called**:
  - `/api/portal/jobs`
  - `/api/portal/estimates`
  - `/api/portal/invoices`
- **Status**: ⚠️ Partial - endpoints exist but may need fixes
- **Fix required**: Ensure filtering by customer works

### /portal/upcoming

- **Data needed**: Upcoming jobs
- **Endpoints called**:
  - `/api/portal/jobs` (filtered by status)
- **Status**: ⚠️ Depends on jobs endpoint
- **Fix required**: None

### /portal/history

- **Data needed**: Past jobs
- **Endpoints called**:
  - `/api/portal/jobs` (filtered by status)
- **Status**: ⚠️ Depends on jobs endpoint
- **Fix required**: None

### /portal/estimates

- **Data needed**: Customer's estimates
- **Endpoints called**:
  - `/api/portal/estimates`
- **Status**: ⚠️ Endpoint exists
- **Fix required**: None

### /portal/invoices

- **Data needed**: Customer's invoices
- **Endpoints called**:
  - `/api/portal/invoices`
- **Status**: ⚠️ Endpoint exists
- **Fix required**: None
