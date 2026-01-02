## Migration Guidelines

- Keep migrations chronological and immutable. Number with zero-padded prefixes (`055_short_description.sql`) and never edit older files—add a new corrective migration instead.
- Create migrations with the Supabase CLI (`supabase migration new <name>`) and apply them consistently (`supabase db push` or your deploy pipeline). Avoid manual DB edits.
- Verify after creating a migration: `supabase db reset --linked` in a scratch DB, `npm run lint && npm run type-check`, and targeted tests that touch the changed tables.
- Check usage before removing objects: search the codebase (`rg TableName` / column names) and drop via a dedicated migration only after confirming it’s unused.
- Add rollback notes for non-trivial changes inside the migration comments so failures are easy to undo with a follow-up migration.

## Periodic Cleanup / Baseline

Only do this when all environments are fully migrated and identical.

1) Take a schema-only snapshot as a new baseline migration (example):
```
supabase db dump --linked --schema-only --file supabase/migrations/100_baseline.sql
```
2) Move older migrations to `supabase/migrations/archive/` for reference (do not delete them). Keep the new baseline plus subsequent migrations in the root.
3) On fresh environments, apply from the baseline forward. Existing environments already at the latest version won’t need the archived files.

## Quick Checklist for New Migrations

- Name is clear, numbered, and idempotent.
- Includes necessary indexes/constraints and matches code changes.
- Provides data backfills or defaults where required.
- Tested locally via `supabase db reset --linked` and app tests.
