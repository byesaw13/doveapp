# Architecture Decisions Record

## Overview

This document records key technical decisions for the DoveApp architecture. It serves as a reference to prevent re-litigation of settled choices and provides context for current implementation constraints. All decisions reflect the actual state of the codebase.

## Decision 001 — Data Access Model

- **Decision**: Use Supabase direct access + Row Level Security (Option A).
- **Status**: Accepted
- **Rationale**: RLS enforces tenant isolation at the database layer (account_id). Reduces duplicated authorization logic in APIs. Matches current app scale and complexity.
- **Consequences**: App code must always provide correct JWT/account context. RLS verification scripts are mandatory.
- **Explicitly NOT doing**: No custom data-access microservice layer. No bypassing RLS for authenticated users.

## Decision 002 — RLS Bypass Policy Scope

- **Decision**: Allow-all (USING true / WITH CHECK true) policies restricted to service_role only.
- **Status**: Accepted
- **Evidence**: supabase/migrations/20250116000000_fix_rls_bypass_policies.sql
- **Consequences**: Application code cannot bypass tenant isolation. Admin/service tasks must use service_role explicitly.

## Decision 003 — Auth & Supabase Client Boundaries

- **Decision**: Strict separation between client-only and server-only Supabase clients.
- **Status**: Accepted
- **Rules**: createBrowserClient() may only exist in "use client" modules. Server code must use createServerClient().
- **Canonical choices**: Client: lib/supabase.ts, Server: lib/supabase/server.ts or lib/auth/session.ts
- **Consequences**: Some legacy helpers are deprecated but retained for compatibility.

## Decision 004 — Guardrails & Enforcement

- **Decision**: Enforce boundaries via automated checks.
- **Status**: Accepted
- **Mechanism**: npm run check:boundaries
- **Purpose**: Prevent accidental browser/client leakage into server code. Fail fast during development.

## Non-Goals (Explicit)

- This repo does NOT: Implement a custom RBAC engine outside Supabase. Use middleware-heavy auth duplication. Allow client-side access to service_role credentials. Abstract Supabase behind a generic repository layer.

## How to Propose a Change

- New decisions must: Add a new numbered entry to this file. Explain why the existing decision is insufficient. Document migration or rollback risks.
