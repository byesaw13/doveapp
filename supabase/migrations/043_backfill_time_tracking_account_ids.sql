-- Backfill account_id values for time tracking tables using existing relationships

-- time_entries: inherit from jobs when missing
UPDATE time_entries te
SET account_id = j.account_id
FROM jobs j
WHERE te.job_id = j.id
  AND te.account_id IS NULL
  AND j.account_id IS NOT NULL;

-- time_breaks: inherit from parent time_entry
UPDATE time_breaks tb
SET account_id = te.account_id
FROM time_entries te
WHERE tb.time_entry_id = te.id
  AND tb.account_id IS NULL
  AND te.account_id IS NOT NULL;

-- time_approvals: inherit from parent time_entry
UPDATE time_approvals ta
SET account_id = te.account_id
FROM time_entries te
WHERE ta.time_entry_id = te.id
  AND ta.account_id IS NULL
  AND te.account_id IS NOT NULL;

-- technician_locations: inherit from related job or time entry when possible
UPDATE technician_locations tl
SET account_id = COALESCE(te.account_id, j.account_id)
FROM time_entries te
LEFT JOIN jobs j ON te.job_id = j.id
WHERE tl.job_id IS NOT NULL
  AND tl.account_id IS NULL
  AND te.job_id = tl.job_id
  AND (te.account_id IS NOT NULL OR j.account_id IS NOT NULL);

-- technician_rates: no reliable linkage; leave NULL for manual correction if needed
