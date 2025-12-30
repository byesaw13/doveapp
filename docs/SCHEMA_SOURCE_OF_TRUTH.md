# Schema Source of Truth

`supabase/schema_baseline.sql` is the authoritative definition of the
database schema (tables, columns, constraints, foreign keys, indexes, and
RLS policies).

All new migrations must be written as diffs against the baseline. When the
baseline changes, ensure every migration reflects the delta from the
current `supabase/schema_baseline.sql` content.
