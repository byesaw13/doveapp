# Option A MVP Spine

## Overview

Option A uses Supabase directly from the browser for CRUD with RLS enforcement.
UI components and pages call a shared Supabase browser client and rely on JWT
claims for account context. Server routes remain limited to webhooks, uploads,
and secrets-backed operations.

## Tenancy and RLS

- CRUD reads/writes go through Supabase client + RLS.
- Authorization is enforced by database policies, not client logic.
- JWT claims provide `account_id` and `role` for UI display and client filtering.
- Never trust `x-account-id` or `x-user-role` headers; proxy strips them before
  forwarding to application code.

## API Surface

- `/api/*` is reserved for webhooks, uploads, email ingress, or secret-backed
  workflows.
- Standard UI CRUD should hit Supabase directly.

## Shared Client + Context

- `lib/supabase/client.ts` exports the singleton browser client.
- `lib/auth/context.ts` provides `getSession`, `getUser`, and `getAuthContext`.
- `getAuthContext()` reads JWT claims (`account_id`, `role`) when present and
  returns nulls if missing without throwing.

## Usage Notes

- Prefer `getAuthContext()` in pages/layouts that need role gating.
- Use `requireRole([...])` to guard layouts without duplicating logic.
