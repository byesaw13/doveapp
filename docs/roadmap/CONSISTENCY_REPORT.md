# Architecture Consistency Report

This report confirms that documentation aligns with repo reality and the multi-app satellite strategy.

## Existing Documentation

All referenced architecture and roadmap documents exist:

- docs/roadmap/SYSTEM_ROADMAP.md: Multi-app roadmap with phases and satellite contracts
- docs/architecture/TABLE_OWNERSHIP.md: Table ownership and write permissions
- docs/architecture/BOUNDARIES.md: Client/server import boundaries
- docs/architecture/DECISIONS.md: ADR for key technical choices
- docs/architecture/ARCHITECTURE.md: System overview with boundaries and diagrams

## Repo Reality Summary

The repository contains complete database schemas for all major domains:

- **Jobs**: Core work units with lifecycle states
- **Clients/Customers**: Customer management and portal profiles
- **Properties**: Physical locations tied to jobs
- **Estimates**: Quote proposals and pricing
- **Invoices/Payments**: Billing and payment event tracking
- **Time Tracking**: Technician time entries and approvals
- **Supporting Tables**: Account memberships, leads, technician data

All tables have RLS enabled with account_id filtering, and migrations include security hardening.

## Clarified Phase Intent

Roadmap phases focus on **workflow activation** rather than schema creation:

- Phase 0: Foundation (auth, RLS, guardrails) ✓ Completed
- Phase 1: Job lifecycle end-to-end activation
- Phase 2: Client/property onboarding flows
- Phase 3: Estimate-to-job conversion workflows
- Phase 4: Invoice/payment reconciliation workflows

Migration files reflect schema evolution; phases track product readiness.

## Satellite Write Contract

Satellites may write only to designated tables:

- **Draft-only**: Estimates (quotes before acceptance)
- **Events-only**: Payment events, job notes, visit logs
- **Append-only**: Time entries, location tracking, activity logs

Doveapp owns all canonical state transitions and lifecycle management. Satellites influence state via proposals or API routes only.

## TBD Items in TABLE_OWNERSHIP.md

No TBD items remain. All tables have assigned ownership:

- Doveapp Core: Jobs, clients, properties, invoices, core workflow tables
- Satellites: Estimates (Estimator), job_notes (AI), payment events (Payments), time tracking (Automation)
- Shared: Account memberships (admin), technician data (workers)

Documentation is consistent with multi-app strategy and current repo state.
