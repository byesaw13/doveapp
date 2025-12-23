# Supabase Access Audit

## Ad-hoc Client Creation Locations

### Server-side API routes (should use admin client for privileged ops)

- app/api/tech/jobs/route.ts: dynamic import createClient with service key
- app/api/tech/schedule/route.ts: dynamic import createClient with service key
- app/api/tech/today-jobs/route.ts: import from @/lib/supabase-server
- app/api/portal/jobs/route.ts: dynamic import createClient with service key
- app/api/portal/invoices/route.ts: dynamic import createClient with service key
- app/api/portal/estimates/route.ts: dynamic import createClient with service key
- app/api/estimates/route.ts: dynamic import createClient with service key
- app/api/dashboard/stats/route.ts: dynamic import createClient with service key
- app/api/admin/jobs/route.ts: dynamic import createClient with service key
- app/api/admin/estimates/route.ts: dynamic import createClient with service key
- app/api/admin/automations/route.ts: import from @/lib/supabase/server (migrate to admin)
- app/api/admin/team/schedules/route.ts: import from @/lib/supabase/server (migrate to admin)
- app/api/admin/team/schedules/[id]/route.ts: import from @/lib/supabase/server (migrate to admin)
- app/api/admin/team/availability/route.ts: import from @/lib/supabase/server (migrate to admin)
- app/api/admin/team/assignments/route.ts: import from @/lib/supabase/server (migrate to admin)

### Browser/client components (should use browser client)

- [Identify if any use supabase directly]

### Scripts/utilities (admin client appropriate)

- scripts/\*.js files: all use @supabase/supabase-js createClient with service key
- lib/api-helpers.ts: has createAdminClient (keep or consolidate)

### Libraries/helpers

- lib/audit-log.ts: import from @/lib/supabase-server (migrate to admin)

## Migration Recommendations

### High Priority (immediate)

- lib/audit-log.ts: migrate to admin client
- app/api/admin/automations/route.ts: migrate to admin client
- app/api/admin/team/\* routes: migrate to admin client

### Medium Priority (PR4+)

- API routes with dynamic imports: consolidate to use admin client
- Scripts: ensure they use service key appropriately

### Low Priority

- Client components: verify they use browser client

## Migration Strategy

1. Start with library helpers (audit-log)
2. Then admin API routes that use import from server
3. Finally, consolidate dynamic imports in API routes
