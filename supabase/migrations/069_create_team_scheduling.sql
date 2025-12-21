-- Team Scheduling System
-- Add scheduling capabilities to the existing team management system

-- Team member availability patterns (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS team_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Note: Overlapping availability validation handled in application logic

  UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Team member scheduled time blocks (specific dates/times)
CREATE TABLE IF NOT EXISTS team_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('work', 'meeting', 'training', 'vacation', 'sick', 'personal', 'other')),
  is_all_day BOOLEAN DEFAULT false,
  location VARCHAR(255), -- Physical location or virtual meeting link
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job assignments to team members
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration_hours DECIMAL(4,2), -- Estimated hours for the job
  actual_duration_hours DECIMAL(4,2), -- Actual hours worked (filled when job is completed)
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(job_id, user_id) -- One assignment per job per user
);

-- Add team scheduling columns to existing time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES team_assignments(id) ON DELETE CASCADE;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS clock_in TIMESTAMPTZ;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS clock_out TIMESTAMPTZ;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS duration_minutes INTEGER GENERATED ALWAYS AS (
  EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60
) STORED;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);

-- Update existing records to populate user_id from technician_id if available
UPDATE time_entries SET user_id = technician_id WHERE user_id IS NULL AND technician_id IS NOT NULL;

-- Indexes for performance
CREATE INDEX idx_team_availability_user_id ON team_availability(user_id);
CREATE INDEX idx_team_availability_day ON team_availability(day_of_week);
CREATE INDEX idx_team_schedules_user_id ON team_schedules(user_id);
CREATE INDEX idx_team_schedules_date ON team_schedules(scheduled_date);
CREATE INDEX idx_team_schedules_type ON team_schedules(schedule_type);
CREATE INDEX idx_team_assignments_job_id ON team_assignments(job_id);
CREATE INDEX idx_team_assignments_user_id ON team_assignments(user_id);
CREATE INDEX idx_team_assignments_status ON team_assignments(status);
CREATE INDEX idx_time_entries_assignment_id ON time_entries(assignment_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in);

-- Row Level Security
ALTER TABLE team_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Team availability policies
CREATE POLICY "Users can view all team availability"
  ON team_availability FOR SELECT USING (true);

CREATE POLICY "Users can manage their own availability"
  ON team_availability FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all availability"
  ON team_availability FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('ADMIN', 'OWNER')
    )
  );

-- Team schedules policies
CREATE POLICY "Users can view all team schedules"
  ON team_schedules FOR SELECT USING (true);

CREATE POLICY "Users can manage their own schedules"
  ON team_schedules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all schedules"
  ON team_schedules FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('ADMIN', 'OWNER')
    )
  );

-- Team assignments policies
CREATE POLICY "Users can view their own assignments"
  ON team_assignments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view assignments for jobs they're assigned to"
  ON team_assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = team_assignments.job_id
      AND jobs.technician_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all assignments"
  ON team_assignments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('ADMIN', 'OWNER')
    )
  );

CREATE POLICY "Users can create assignments they assign"
  ON team_assignments FOR INSERT WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can update their own assignments"
  ON team_assignments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assignments"
  ON team_assignments FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('ADMIN', 'OWNER')
    )
  );

-- Time entries policies
CREATE POLICY "Users can view their own time entries"
  ON time_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own time entries"
  ON time_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time entries"
  ON time_entries FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('ADMIN', 'OWNER')
    )
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_team_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_team_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_schedules_updated_at
  BEFORE UPDATE ON team_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_team_schedules_updated_at();

CREATE TRIGGER team_assignments_updated_at
  BEFORE UPDATE ON team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_team_assignments_updated_at();

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_time_entries_updated_at();

-- Helper functions for scheduling
CREATE OR REPLACE FUNCTION get_team_member_availability(
  user_uuid UUID,
  check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  target_day INTEGER := EXTRACT(DOW FROM check_date);
BEGIN
  RETURN QUERY
  SELECT
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    ta.is_available
  FROM team_availability ta
  WHERE ta.user_id = user_uuid
    AND ta.day_of_week = target_day
    AND ta.is_available = true
  ORDER BY ta.start_time;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_team_members(
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  availability_conflicts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name' as full_name,
    COUNT(*)::INTEGER as availability_conflicts
  FROM auth.users u
  LEFT JOIN team_schedules ts ON ts.user_id = u.id
    AND ts.scheduled_date = start_datetime::DATE
    AND (
      (ts.start_time, ts.end_time) OVERLAPS (start_datetime::TIME, end_datetime::TIME)
      OR ts.is_all_day = true
    )
  WHERE u.raw_user_meta_data->>'role' IN ('TECH', 'ADMIN', 'OWNER')
    AND u.is_active = true
  GROUP BY u.id, u.raw_user_meta_data->>'full_name'
  HAVING COUNT(ts.id) = 0; -- No conflicting schedules
END;
$$ LANGUAGE plpgsql;