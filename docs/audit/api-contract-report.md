# API Contract Report

## Schemas Used

- Primary: lib/api/validation.ts - Used in app/api/jobs/route.ts, app/api/clients/route.ts, etc.
- Secondary: lib/validations/api-schemas.ts - Not imported in API routes, appears legacy per unused-code-report.json. Mark as deprecated.

## Job Creation Validation

- Schema: createJobSchema in lib/api/validation.ts
- Fields: client_id required (UUID), status defaults to 'scheduled'
- Evidence: app/api/jobs/route.ts:9 imports createJobSchema, inserts client_id.
- Match: DB jobs.client_id NOT NULL, status enum includes 'scheduled'.

## Client Creation Validation

- Schema: createClientSchema in lib/api/validation.ts
- Fields: account_id required.
- Evidence: app/api/clients/route.ts:5 imports createClientSchema.

## Estimate Creation

- Schema: createEstimateSchema
- Used in app/api/estimates/route.ts

## Findings

- No obvious mismatches.
- Legacy api-schemas.ts can be removed if unused.
