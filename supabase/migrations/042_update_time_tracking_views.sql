-- Update time tracking views to include account_id and support tenant scoping

-- Replace time_tracking_summary view
DROP VIEW IF EXISTS time_tracking_summary;
CREATE VIEW time_tracking_summary AS
SELECT
  te.id,
  te.account_id,
  te.technician_name,
  te.job_id,
  j.job_number,
  j.title AS job_title,
  COALESCE(c.company_name, c.first_name || ' ' || c.last_name) AS client_name,
  te.start_time,
  te.end_time,
  te.total_hours,
  te.billable_hours,
  te.hourly_rate,
  te.total_amount,
  te.status,
  te.notes,
  COALESCE(break_summary.total_breaks, 0) AS total_breaks,
  COALESCE(break_summary.total_break_minutes, 0) AS total_break_minutes,
  ta.status AS approval_status,
  ta.approver_name,
  ta.approved_at
FROM time_entries te
LEFT JOIN jobs j ON te.job_id = j.id AND (j.account_id = te.account_id OR j.account_id IS NULL)
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN (
  SELECT
    account_id,
    time_entry_id,
    COUNT(*) AS total_breaks,
    SUM(duration_minutes) AS total_break_minutes
  FROM time_breaks
  WHERE end_time IS NOT NULL
  GROUP BY account_id, time_entry_id
) break_summary ON te.id = break_summary.time_entry_id
  AND (break_summary.account_id = te.account_id OR break_summary.account_id IS NULL)
LEFT JOIN time_approvals ta ON te.id = ta.time_entry_id
  AND (ta.account_id = te.account_id OR ta.account_id IS NULL)
ORDER BY te.start_time DESC;

-- Replace technician_productivity view
DROP VIEW IF EXISTS technician_productivity;
CREATE VIEW technician_productivity AS
SELECT
  account_id,
  technician_name,
  DATE_TRUNC('month', start_time) AS month,
  COUNT(*) AS total_entries,
  SUM(total_hours) AS total_hours,
  SUM(billable_hours) AS billable_hours,
  AVG(hourly_rate) AS avg_hourly_rate,
  SUM(total_amount) AS total_amount,
  AVG(total_hours) AS avg_hours_per_entry,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_entries,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_entries
FROM time_entries
WHERE end_time IS NOT NULL
GROUP BY account_id, technician_name, DATE_TRUNC('month', start_time)
ORDER BY month DESC, technician_name;

-- Replace job_time_summary view
DROP VIEW IF EXISTS job_time_summary;
CREATE VIEW job_time_summary AS
SELECT
  j.id AS job_id,
  j.account_id,
  j.job_number,
  j.title,
  COALESCE(c.company_name, c.first_name || ' ' || c.last_name) AS client_name,
  COUNT(te.id) AS time_entries,
  SUM(te.total_hours) AS total_hours,
  SUM(te.billable_hours) AS billable_hours,
  SUM(te.total_amount) AS total_billed,
  AVG(te.hourly_rate) AS avg_hourly_rate,
  MIN(te.start_time) AS first_clock_in,
  MAX(te.end_time) AS last_clock_out
FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN time_entries te ON j.id = te.job_id
  AND (te.account_id = j.account_id OR te.account_id IS NULL)
GROUP BY j.id, j.account_id, j.job_number, j.title, c.first_name, c.last_name, c.company_name
ORDER BY j.created_at DESC;
