# Archived Supabase Migrations

This directory contains the legacy migration history that has been replaced by a baseline migration approach.

## Background

The original migration chain (64 files) contained:

- Multiple destructive operations (DROP SCHEMA/TABLE)
- Redundant table recreations
- Mixed development and production migrations
- Lack of idempotency guards

To provide a cleaner, safer migration path forward, we have:

1. **Hardened the existing chain** with safety guards (in the active migrations folder)
2. **Created a baseline migration** representing the current schema state
3. **Archived the legacy chain** here for historical reference

## What Changed

### Before (Legacy Chain)

- 64 timestamped migration files
- Destructive operations without guards
- Redundant schema recreations
- No clear development vs production separation

### After (Baseline Approach)

- Single baseline migration representing current schema
- Future migrations build incrementally from baseline
- Clear separation of development and production concerns
- Idempotent and safe operations

## Migration History Preservation

All original migration files have been preserved with their original filenames and content. This ensures:

- **Historical context**: Understanding of schema evolution
- **Debugging capability**: Reference for past schema states
- **Audit trail**: Complete record of changes

## Using Archived Migrations

⚠️ **WARNING**: These archived migrations should NOT be applied to any environment.

- They contain destructive operations that could cause data loss
- They may not be compatible with the current application state
- They lack the safety guards added to the active migrations

If you need to understand the evolution of a particular table or feature, examine these files for historical context only.

## Going Forward

New migrations should:

- Build upon the baseline schema
- Use safe, incremental changes
- Follow the standards in `docs/setup/migrations.md`
- Be tested with `supabase db reset` before committing

## Contact

If you need to understand the reasoning behind any archived migration, refer to:

- `docs/status/migrations-audit.md` (risk assessment)
- `docs/status/migrations-squash-summary.md` (squash details)
- Git history for specific changes
