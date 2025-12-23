# Architecture Boundaries

## Hard Rules

- app/ = routing/layout only (no direct DB calls)

- Supabase reads/writes live ONLY in features/_/(queries|commands).ts OR lib/db/_

- UI components live under features/\*/ui or components/shared

- Validation (zod or equivalent) at the boundary in features/\*/schema.ts

- No "random utils dump"; utilities go under lib/ with clear ownership

## Enforcement

For light enforcement, we document these rules. ESLint rules may be added later if needed.
