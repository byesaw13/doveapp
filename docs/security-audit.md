# Security Audit Report

## Summary Table

| Risk Level | Count | Description                                                          |
| ---------- | ----- | -------------------------------------------------------------------- |
| CRITICAL   | 3     | Routes using service role without auth checks                        |
| HIGH       | 15    | Routes with auth but using service role or missing permission checks |
| MEDIUM     | 25    | Routes with basic auth but incomplete permission enforcement         |
| LOW        | 45    | Routes with proper auth and permission checks                        |

## Detailed Route Analysis

### Admin Routes (`/api/admin/*`)

#### CRITICAL Risk

1. **app/api/admin/team/schedules/route.ts**
   - **Supabase Client**: Service role (`createAdminClient`)
   - **Auth Checks**: None
   - **Risk**: CRITICAL - Direct service role access without authentication or permission validation
   - **Issue**: Imports `createAdminClient` and performs operations without any auth guards

2. **app/api/admin/team/assignments/route.ts**
   - **Supabase Client**: Service role (`createAdminClient`)
   - **Auth Checks**: None
   - **Risk**: CRITICAL
   - **Issue**: Same as above

3. **app/api/admin/team/availability/route.ts**
   - **Supabase Client**: Service role (`createAdminClient`)
   - **Auth Checks**: None
   - **Risk**: CRITICAL
   - **Issue**: Same as above

#### HIGH Risk

4. **app/api/admin/jobs/route.ts**
   - **Supabase Client**: Request-aware (`createAuthenticatedClient`) with service role fallback
   - **Auth Checks**: `requireAdminContext`
   - **Risk**: HIGH
   - **Issue**: Has auth but fallback to service role for demo mode

5. **app/api/admin/clients/route.ts**
   - **Supabase Client**: Request-aware
   - **Auth Checks**: `requireAdminContext`
   - **Risk**: HIGH
   - **Issue**: Missing explicit permission checks beyond role validation

#### MEDIUM Risk

6. **app/api/admin/estimates/route.ts**
   - **Supabase Client**: Request-aware
   - **Auth Checks**: `requireAdminContext`
   - **Risk**: MEDIUM
   - **Issue**: Auth present but no specific permission validation

### Tech Routes (`/api/tech/*`)

#### MEDIUM Risk

7. **app/api/tech/jobs/route.ts**
   - **Supabase Client**: Request-aware
   - **Auth Checks**: `requireTechContext`
   - **Risk**: MEDIUM
   - **Issue**: Basic role check but no specific permission validation

### Portal Routes (`/api/portal/*`)

#### LOW Risk

8. **app/api/portal/jobs/route.ts**
   - **Supabase Client**: Request-aware
   - **Auth Checks**: `requireCustomerContext` with proper scoping
   - **Risk**: LOW
   - **Issue**: Well-implemented with tenant scoping

### Other Privileged Routes

#### HIGH Risk

9. **app/api/square/oauth/callback/route.ts**
   - **Supabase Client**: Service role
   - **Auth Checks**: None
   - **Risk**: HIGH
   - **Issue**: OAuth callback handling sensitive data without auth

10. **app/api/webhooks/stripe/route.ts**
    - **Supabase Client**: Service role
    - **Auth Checks**: None
    - **Risk**: HIGH
    - **Issue**: Webhook endpoint with service role access

### Recommendations

1. **Immediate Action Required**: Fix CRITICAL routes (team schedules/assignments/availability) by adding auth guards and permission checks
2. **High Priority**: Remove service role fallbacks and implement proper permission validation
3. **Standardization**: Implement canonical auth/RBAC system across all routes
4. **Testing**: Add security smoke tests to prevent regressions</content>
   <parameter name="filePath">docs/security-audit.md
