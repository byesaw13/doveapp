MEGA HEADER — MUST READ FIRST (Binding)

Context + Sources of Truth:

- Treat Doveapp as the system of record.
- The following docs are binding constraints for ALL work:
  1. docs/roadmap/AI_GUARDRAILS.md
  2. docs/roadmap/SYSTEM_ROADMAP.md
  3. docs/architecture/TABLE_OWNERSHIP.md
- If any instruction conflicts, resolve in this order:
  AI_GUARDRAILS.md → TABLE_OWNERSHIP.md → SYSTEM_ROADMAP.md → prompt text.

Global Guardrails (non-negotiable):

- Doveapp is the system of record. Satellites do not own canonical state.
- Enforce RLS-first isolation; never bypass RLS except service_role-only admin tasks already defined.
- Follow SYSTEM_ROADMAP + TABLE_OWNERSHIP as binding rules.
- Schema changes: add NEW migrations only. Do not edit/rename existing migrations unless a migration is actively failing clean installs.
- Do NOT change proxy.ts.
- Do NOT change UI behavior unless explicitly asked.
- If changes are needed outside Allowed Files, STOP and explain why.

Migration Rules:

- Prefer additive migrations in supabase/migrations/ with unique timestamps.
- Any migration touching optional/non-spine tables MUST be guarded (IF EXISTS) unless the table is created earlier in the chain.
- Migrations must be idempotent where possible (IF NOT EXISTS / safe guards) and must not assume a fresh DB unless explicitly stated.
- Never move/rename files in supabase/migrations_archive or rely on it for required schema.

Remote Push Policy (Gated):

- Do NOT push migrations to remote unless this prompt contains the exact token: REMOTE_PUSH_APPROVED
- If REMOTE_PUSH_APPROVED is NOT present:
  - Run local verification only.
  - Print the exact remote push command(s) the user should run manually.
- If REMOTE_PUSH_APPROVED IS present:
  - After local verification passes, push migrations to remote (npx supabase db push).
  - Then re-run verification steps that confirm remote/app consistency (as applicable).

Verification Requirements (always include):

- npm run check:boundaries
- npx supabase db reset --local (if schema changes are involved)
- Execute supabase/rls/verify_all_isolation.sql when RLS or multi-tenant behavior is touched
- Minimal API smoke test steps for any changed/added endpoint (curl examples or equivalent)

Work Output Format:

- Always provide:
  1. A short “Plan” (what will change and why)
  2. A unified diff for ONLY the Allowed Files
  3. A “How to verify” checklist (commands)
- If you cannot complete within Allowed Files, STOP and explain the smallest possible file list expansion.

Allowed Files (fill in for each task; do not touch anything else):

- [LIST EXACT FILE PATHS HERE]
