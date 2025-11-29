-- Time Tracking System
-- Comprehensive time tracking for field service technicians

-- Create time_entries table for main time tracking
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID, -- Could reference users table when implemented
  technician_name TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_hours DECIMAL(6,2), -- Calculated field
  billable_hours DECIMAL(6,2), -- Hours that can be billed to client
  hourly_rate DECIMAL(8,2), -- Rate for this technician
  total_amount DECIMAL(10,2), -- Calculated: billable_hours * hourly_rate
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'approved', 'rejected', 'paid')),
  notes TEXT,
  location_start JSONB, -- GPS coordinates when clocking in
  location_end JSONB, -- GPS coordinates when clocking out
  device_info JSONB, -- Device/browser info for verification
  ip_address INET, -- IP address for additional verification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_breaks table for tracking breaks within time entries
CREATE TABLE time_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL DEFAULT 'lunch' CHECK (break_type IN ('lunch', 'break', 'meeting', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated field
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_approvals table for approval workflow
CREATE TABLE time_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  approver_id UUID, -- Could reference users table
  approver_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  approved_hours DECIMAL(6,2),
  approved_amount DECIMAL(10,2),
  approval_notes TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create technician_locations table for GPS tracking
CREATE TABLE technician_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID,
  technician_name TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(6,2), -- GPS accuracy in meters
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_type TEXT DEFAULT 'tracking' CHECK (activity_type IN ('tracking', 'clock_in', 'clock_out', 'job_start', 'job_end')),
  job_id UUID REFERENCES jobs(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create technician_rates table for hourly rates
CREATE TABLE technician_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID,
  technician_name TEXT NOT NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE, -- NULL means currently active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(technician_id, effective_date) -- Prevent overlapping rates
);

-- Create indexes for performance
CREATE INDEX idx_time_entries_technician_id ON time_entries(technician_id);
CREATE INDEX idx_time_entries_job_id ON time_entries(job_id);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_end_time ON time_entries(end_time);

CREATE INDEX idx_time_breaks_time_entry_id ON time_breaks(time_entry_id);
CREATE INDEX idx_time_breaks_start_time ON time_breaks(start_time);

CREATE INDEX idx_time_approvals_time_entry_id ON time_approvals(time_entry_id);
CREATE INDEX idx_time_approvals_status ON time_approvals(status);

CREATE INDEX idx_technician_locations_technician_id ON technician_locations(technician_id);
CREATE INDEX idx_technician_locations_timestamp ON technician_locations(timestamp);
CREATE INDEX idx_technician_locations_job_id ON technician_locations(job_id);

CREATE INDEX idx_technician_rates_technician_id ON technician_rates(technician_id);
CREATE INDEX idx_technician_rates_effective_date ON technician_rates(effective_date);

-- Create function to calculate total hours when time entry is updated
CREATE OR REPLACE FUNCTION calculate_time_entry_totals()
RETURNS TRIGGER AS $$
DECLARE
  break_minutes INTEGER := 0;
  total_minutes INTEGER;
  billable_minutes INTEGER;
BEGIN
  -- Calculate total break time in minutes
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO break_minutes
  FROM time_breaks
  WHERE time_entry_id = NEW.id AND end_time IS NOT NULL;

  -- Calculate total time in minutes
  IF NEW.end_time IS NOT NULL THEN
    total_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    billable_minutes := GREATEST(total_minutes - break_minutes, 0);

    NEW.total_hours := ROUND(total_minutes / 60.0, 2);
    NEW.billable_hours := ROUND(billable_minutes / 60.0, 2);
    NEW.total_amount := ROUND(NEW.billable_hours * COALESCE(NEW.hourly_rate, 0), 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time entry calculations
CREATE TRIGGER trigger_calculate_time_entry_totals
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_totals();

-- Create function to calculate break duration
CREATE OR REPLACE FUNCTION calculate_break_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for break duration calculations
CREATE TRIGGER trigger_calculate_break_duration
    BEFORE INSERT OR UPDATE ON time_breaks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_break_duration();

-- Create function to get current technician rate
CREATE OR REPLACE FUNCTION get_current_technician_rate(
  tech_name TEXT,
  check_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(8,2) AS $$
DECLARE
  current_rate DECIMAL(8,2);
BEGIN
  SELECT hourly_rate
  INTO current_rate
  FROM technician_rates
  WHERE technician_name = tech_name
    AND effective_date <= check_date
    AND (end_date IS NULL OR end_date >= check_date)
  ORDER BY effective_date DESC
  LIMIT 1;

  RETURN COALESCE(current_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Create view for time tracking summary
CREATE VIEW time_tracking_summary AS
SELECT
  te.id,
  te.technician_name,
  te.job_id,
  j.job_number,
  j.title as job_title,
  COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as client_name,
  te.start_time,
  te.end_time,
  te.total_hours,
  te.billable_hours,
  te.hourly_rate,
  te.total_amount,
  te.status,
  te.notes,
  -- Break information
  COALESCE(break_summary.total_breaks, 0) as total_breaks,
  COALESCE(break_summary.total_break_minutes, 0) as total_break_minutes,
  -- Approval information
  ta.status as approval_status,
  ta.approver_name,
  ta.approved_at
FROM time_entries te
LEFT JOIN jobs j ON te.job_id = j.id
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN (
  SELECT
    time_entry_id,
    COUNT(*) as total_breaks,
    SUM(duration_minutes) as total_break_minutes
  FROM time_breaks
  WHERE end_time IS NOT NULL
  GROUP BY time_entry_id
) break_summary ON te.id = break_summary.time_entry_id
LEFT JOIN time_approvals ta ON te.id = ta.time_entry_id
ORDER BY te.start_time DESC;

-- Create view for technician productivity
CREATE VIEW technician_productivity AS
SELECT
  technician_name,
  DATE_TRUNC('month', start_time) as month,
  COUNT(*) as total_entries,
  SUM(total_hours) as total_hours,
  SUM(billable_hours) as billable_hours,
  AVG(hourly_rate) as avg_hourly_rate,
  SUM(total_amount) as total_amount,
  AVG(total_hours) as avg_hours_per_entry,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_entries,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_entries
FROM time_entries
WHERE end_time IS NOT NULL
GROUP BY technician_name, DATE_TRUNC('month', start_time)
ORDER BY month DESC, technician_name;

-- Create view for job time summary
CREATE VIEW job_time_summary AS
SELECT
  j.id as job_id,
  j.job_number,
  j.title,
  COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as client_name,
  COUNT(te.id) as time_entries,
  SUM(te.total_hours) as total_hours,
  SUM(te.billable_hours) as billable_hours,
  SUM(te.total_amount) as total_billed,
  AVG(te.hourly_rate) as avg_hourly_rate,
  MIN(te.start_time) as first_clock_in,
  MAX(te.end_time) as last_clock_out
FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN time_entries te ON j.id = te.job_id
GROUP BY j.id, j.job_number, j.title, c.first_name, c.last_name, c.company_name
ORDER BY j.created_at DESC;