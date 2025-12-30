# Proxy.ts Header Injection Audit

## Overview

This document audits the header injection functionality in `proxy.ts` to confirm it properly injects and forwards `x-user-id`, `x-account-id`, and `x-user-role` to downstream route handlers.

## Audit Findings

### 1. Authenticated User Determination

- **Location**: `proxy.ts:45-48`
- **Method**: Uses `await supabase.auth.getUser()` to retrieve the authenticated user from Supabase session.

### 2. Account ID and Role Resolution

- **Location**:
  - Primary memberships: `proxy.ts:73-77` (fetches from `account_memberships` table), `proxy.ts:164` (selects first active membership)
  - Customer fallback: `proxy.ts:109-113` (fetches account_id from `customers` table)
  - Demo mode: `proxy.ts:92-96` (uses hardcoded demo values)
- **Resolution Logic**:
  - First checks for active account memberships
  - Falls back to customer record lookup for portal routes
  - Uses demo account in demo mode

### 3. Header Injection

- **Headers Set**: All three required headers are properly set in all code paths
- **Locations**:
  - Demo mode: `proxy.ts:94-96`
  - Customer fallback: `proxy.ts:127-129`
  - Primary membership: `proxy.ts:168-170`
- **Headers**:
  - `x-user-id`: Set to `user.id`
  - `x-account-id`: Set to membership `account_id` or customer `account_id` or `DEMO_ACCOUNT_ID`
  - `x-user-role`: Set to membership `role` or `'CUSTOMER'` or demo role

### 4. Response Forwarding

- **Location**: All successful paths return `NextResponse.next({ request: { headers: requestHeaders } })`
- **Specific Locations**:
  - Demo mode: `proxy.ts:97-103`
  - Customer fallback: `proxy.ts:130-136`
  - Primary membership: `proxy.ts:223-229`
- **Confirmation**: Headers are correctly forwarded via the `request` object in `NextResponse.next()`

### 5. Cookie Application

- **Function**: `applyCookies` is defined at `proxy.ts:18-23` and applies pending cookies to responses
- **Usage**: Called on all return paths, including:
  - Successful forwards: `proxy.ts:97`, `proxy.ts:130`, `proxy.ts:223`
  - Error responses: All redirect and JSON error responses wrap with `applyCookies`
- **Confirmation**: No non-error paths bypass cookie application

### 6. Matcher Configuration

- **Location**: `proxy.ts:232-253`
- **Included Paths**:
  - `/admin/:path*`
  - `/tech/:path*`
  - `/portal/:path*` (covers customer portal)
  - Various `/api/*` routes including admin, clients, jobs, estimates, invoices, leads, kpi, dashboard, materials, time-tracking, automation, automations, settings, tech, and portal APIs
- **Coverage**: Includes all intended admin, tech, and customer (portal) routes, plus relevant API endpoints

## Missing Steps

No missing steps identified. The proxy.ts implementation correctly:

- Determines authenticated users
- Resolves account context and roles
- Injects all required headers
- Forwards headers to downstream handlers
- Applies cookies on all paths
- Matches appropriate routes

## Recommendations

No changes needed. The header injection is fully implemented and functional.</content>
<parameter name="filePath">docs/audit/proxy_header_sanity_check.md
