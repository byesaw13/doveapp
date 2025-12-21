-- Employee profiles table for comprehensive employee information
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,

  -- Contact Information
  personal_email TEXT,
  work_email TEXT,
  primary_phone TEXT,
  secondary_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',

  -- Employment Information
  employee_id TEXT UNIQUE,
  hire_date DATE,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
  job_title TEXT,
  department TEXT,
  manager_id UUID REFERENCES auth.users(id),

  -- Compensation
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),
  salary DECIMAL(12,2),
  pay_frequency TEXT DEFAULT 'hourly' CHECK (pay_frequency IN ('hourly', 'salary', 'commission')),

  -- Work Information
  work_schedule TEXT, -- JSON string for schedule preferences
  skills TEXT[], -- Array of skills/certifications
  certifications TEXT[], -- Array of certifications
  licenses TEXT[], -- Array of licenses

  -- Additional Information
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Profile change requests table for approval workflow
CREATE TABLE IF NOT EXISTS profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,

  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN ('update', 'create')),
  requested_changes JSONB NOT NULL,
  current_values JSONB,

  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS employee_profiles_user_id_idx ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS employee_profiles_employee_id_idx ON employee_profiles(employee_id);
CREATE INDEX IF NOT EXISTS employee_profiles_manager_id_idx ON employee_profiles(manager_id);
CREATE INDEX IF NOT EXISTS employee_profiles_status_idx ON employee_profiles(employment_status);

CREATE INDEX IF NOT EXISTS profile_change_requests_user_id_idx ON profile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS profile_change_requests_status_idx ON profile_change_requests(status);
CREATE INDEX IF NOT EXISTS profile_change_requests_expires_at_idx ON profile_change_requests(expires_at);

-- RLS Policies
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own profile
CREATE POLICY "Users can view own employee profile" ON employee_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and owners can view all profiles
CREATE POLICY "Admins can view all employee profiles" ON employee_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE account_memberships.user_id = auth.uid()
      AND account_memberships.is_active = true
      AND account_memberships.role IN ('ADMIN', 'OWNER')
    )
  );

-- Users can update their own profile (creates change request)
CREATE POLICY "Users can insert own profile" ON employee_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update employee profiles" ON employee_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE account_memberships.user_id = auth.uid()
      AND account_memberships.is_active = true
      AND account_memberships.role IN ('ADMIN', 'OWNER')
    )
  );

-- Change request policies
CREATE POLICY "Users can view own change requests" ON profile_change_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own change requests" ON profile_change_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all change requests" ON profile_change_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE account_memberships.user_id = auth.uid()
      AND account_memberships.is_active = true
      AND account_memberships.role IN ('ADMIN', 'OWNER')
    )
  );

CREATE POLICY "Admins can update change requests" ON profile_change_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE account_memberships.user_id = auth.uid()
      AND account_memberships.is_active = true
      AND account_memberships.role IN ('ADMIN', 'OWNER')
    )
  );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_employee_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW EXECUTE FUNCTION update_employee_profile_updated_at();

-- Comments
COMMENT ON TABLE employee_profiles IS 'Comprehensive employee profile information including contact details, employment info, and compensation';
COMMENT ON TABLE profile_change_requests IS 'Approval workflow for employee profile changes requiring admin review';