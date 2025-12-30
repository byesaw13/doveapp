# SYSTEM ROADMAP — Doveapp & Satellite Ecosystem

## Canonical Instruction for AI Assistants

This document is the authoritative source for:

- Architecture decisions
- System boundaries
- Development order
- Non-goals

Any AI assistant should:

- Treat Doveapp as the system of record
- Treat satellite apps as value generators only
- Respect RLS-first data isolation
- Avoid proposing features that violate these constraints

## 1. Purpose of This Document

This roadmap coordinates the transition to a multi-app architecture where Doveapp serves as the system of record for core business data, while satellite applications generate value by reading from and writing limited updates to Supabase. It prevents scope creep by clearly defining responsibilities and access patterns. Doveapp will remain intentionally boring, focusing on data integrity and operational reliability.

## 2. Architectural North Star

- **Doveapp owns truth**: All canonical business state lives in Doveapp's database schema
- **Satellite apps generate value**: Specialized apps consume data and produce derived outputs
- **Supabase enforces isolation and contracts**: RLS policies control all access (see docs/architecture/DECISIONS.md)
- References: docs/architecture/ARCHITECTURE.md, docs/architecture/DECISIONS.md, docs/architecture/TABLE_OWNERSHIP.md, docs/architecture/BOUNDARIES.md
- Non-goals: Monolith consolidation, duplicated authorization logic, AI systems owning primary state

## Current Repo Baseline (Reality Map)

### Schema Present

- Jobs, clients, properties, estimates, invoices tables exist with full schemas
- Account memberships, RLS policies, and multi-tenant isolation implemented
- Payment events, time tracking, and technician data tables present
- Supabase migrations include hardening and boundary enforcement

### Workflows Incomplete

- Job lifecycle states exist but lack end-to-end activation in UI/API
- Estimate-to-job conversion not fully implemented
- Invoice generation from jobs incomplete
- Client onboarding and property management partially built

### Satellite Split Status

- All functionality currently lives in monolith Doveapp
- No satellite apps extracted yet
- AI features, estimator logic, and payment processing embedded in core app
- Shared UI components and business logic need separation

## 3. System Boundaries & Responsibilities

| System                     | Owns Data? | Writes Canonical State?      | Typical Access Pattern           | Notes                                         |
| -------------------------- | ---------- | ---------------------------- | -------------------------------- | --------------------------------------------- |
| Doveapp (core)             | Yes        | Yes                          | Full CRUD via API routes         | System of record, enforces all business rules |
| Estimator App              | No         | Limited (estimates only)     | Scoped writes to estimates table | Generates quotes, reads job/client data       |
| AI App                     | No         | Limited (job updates, notes) | Scoped writes to jobs/notes      | Processes job data, adds insights             |
| Payments App               | No         | Limited (payment events)     | Scoped writes to payments table  | Records payment outcomes, reads invoices      |
| Automation / n8n / workers | No         | Limited (status updates)     | Scoped writes to jobs/invoices   | Processes workflows, updates statuses         |
| External tools (future)    | No         | No                           | Read-only access                 | Analytics, reporting, integrations            |

## 4. Core Data Primitives (System of Record)

- **Jobs**: Core work units with full lifecycle management. Satellites can read for context and write limited status updates.
- **Clients**: Customer records with contact and history. Satellites can read for personalization.
- **Properties**: Physical locations tied to jobs. Satellites can read for scheduling/logistics.
- **Estimates**: Quote records capturing pricing proposals. Satellites can create but Doveapp manages lifecycle.
- **Invoices**: Billing documents generated from completed jobs. Satellites can read but not create/modify.
- **Payments**: Event records of payment transactions. Satellites can record outcomes but not process payments.

## 5. Satellite App Pattern (Required Contract)

All satellite apps must follow this pattern:

- **Authentication**: Use service_role or scoped JWT with account_id claims
- **Supabase access**: Read access to relevant tables, limited write permissions
- **Allowed tables**: Only tables explicitly granted in RLS policies
- **Forbidden behaviors**: No direct database writes except through approved APIs, no bypassing RLS
- **Failure tolerance**: Satellites can fail without corrupting core data; Doveapp remains operational

## 6. Phased Roadmap (System-Wide)

### Phase 0 — Foundation (Completed)

- Auth boundaries established
- RLS policies hardened
- Verification scripts implemented
- Boundary guardrails added
- Status: DONE

**Note**: Migration file names (e.g., "mvp_spine_security_hardening.sql") reflect schema evolution, not product workflow completion. Roadmap phases track end-to-end feature activation and integration readiness.

### Phase 1 — Job Lifecycle Completion

- **Scope**: Activate job state transitions, add timeline UI, implement cost/time tracking
- **Exit Criteria**: Jobs can be created from estimates, updated through completion, with full audit trail
- **Unblocks**: Reliable job data for satellite integrations and reporting

### Phase 2 — Client & Property Model

- **Scope**: Complete client onboarding flow, property management UI/API
- **Exit Criteria**: Clients can self-register, properties are linked to jobs with validation
- **Unblocks**: Proper customer context for estimates and operational scheduling

### Phase 3 — Estimates as Conversion Records

- **Scope**: Implement estimate acceptance, automatic job creation, snapshot auditing
- **Exit Criteria**: Estimates convert to jobs with preserved pricing history
- **Unblocks**: Revenue pipeline visibility and conversion analytics

### Phase 4 — Invoicing & Payment Events

- **Scope**: Build invoice generation from jobs, payment event recording and reconciliation
- **Exit Criteria**: Completed jobs generate invoices, payments are tracked with reconciliation UI
- **Unblocks**: Financial reporting, cash flow tracking, and billing automation

### Phase 5 — Satellite Expansion

#### Estimator App

- Lives: Quote generation logic and estimate templates
- Does NOT: Own client data or job creation logic
- Integration: Writes to estimates table, reads clients/jobs

#### AI App

- Lives: Job analysis, recommendation engine, automated notes
- Does NOT: Make billing decisions or modify financial data
- Integration: Writes job updates and notes, reads job/client history

#### Payments App

- Lives: Payment processor integrations and outcome recording
- Does NOT: Generate invoices or modify pricing
- Integration: Writes payment events, reads invoices

## Satellite Integration Contract (Write Rules)

Satellites may write only to Draft-only, Events-only, or Append-only tables as defined in docs/architecture/TABLE_OWNERSHIP.md. Doveapp is the sole authority for lifecycle state transitions (job status changes, invoice generation, client activation).

- Canonical Owner is Doveapp for all core primitives (jobs/clients/properties/estimates/invoices). Satellites may be primary producers of drafts/events/notes, but never the canonical authority.
- See: docs/architecture/TABLE_OWNERSHIP.md

Any satellite influencing canonical state must do so via:

- Intermediate proposal/event tables (estimates, job_notes, payment events)
- Doveapp API routes that enforce business rules and validation

Satellites cannot directly modify core workflow states or create canonical records.

## 7. Access Control & Security Model

- RLS as primary enforcement layer
- service_role restricted to administrative tasks
- Read-only keys for analytics/reporting
- All changes must pass npm run check:boundaries

## 8. Operational Rules (Read Before Building)

- New business logic belongs in Doveapp
- Satellite apps only for specialized value generation
- Propose new satellites by adding to this roadmap first
- Avoid duplicating Doveapp logic in satellites
- Sunset satellites by removing access keys and documenting dependencies

## 9. How This Roadmap Evolves

- Update phase status to DONE when all items complete
- Add new phases only when current phase requirements are met
- New satellite systems require roadmap approval first
- Changes must maintain system boundaries and non-goals

## 10. "If You're Unsure, Read This First"

- **Should this be in Doveapp?** If it affects canonical business state or core workflows
- **Should this be a satellite?** If it's specialized processing that enhances but doesn't own data
- **Should this be deferred?** If it violates system boundaries or requires incomplete phases
