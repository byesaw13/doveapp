-- Tool Tracking Extension for Materials Inventory
-- This extends the materials system to include tool management

-- Add tool-specific fields to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_tool BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS tool_condition TEXT CHECK (tool_condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair', 'retired')) DEFAULT 'good';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS assigned_to UUID; -- Could reference users table if we add user management
ALTER TABLE materials ADD COLUMN IF NOT EXISTS assigned_to_name TEXT; -- For now, store technician name
ALTER TABLE materials ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS tool_status TEXT NOT NULL DEFAULT 'available' CHECK (tool_status IN ('available', 'assigned', 'maintenance', 'lost', 'retired'));
ALTER TABLE materials ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS warranty_expires DATE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER; -- Days between maintenance
ALTER TABLE materials ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

-- Create tool_assignments table for detailed assignment tracking
CREATE TABLE tool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  assigned_to UUID, -- Could reference users table
  assigned_to_name TEXT NOT NULL,
  assigned_by UUID, -- Who assigned the tool
  assigned_by_name TEXT,
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- If assigned for a specific job
  notes TEXT,
  condition_at_assignment TEXT CHECK (condition_at_assignment IN ('excellent', 'good', 'fair', 'poor')),
  condition_at_return TEXT CHECK (condition_at_return IN ('excellent', 'good', 'fair', 'poor', 'needs_repair', 'damaged')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tool_maintenance table for maintenance tracking
CREATE TABLE tool_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- 'scheduled', 'repair', 'inspection', 'calibration'
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  technician_name TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  parts_used TEXT, -- JSON array of parts/materials used
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  next_maintenance_date DATE, -- Calculated based on maintenance interval
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_tools table for tools assigned to specific jobs
CREATE TABLE job_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_date TIMESTAMPTZ,
  assigned_by UUID,
  assigned_by_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'lost', 'damaged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, material_id) -- Prevent duplicate tool assignments per job
);

-- Create indexes for better performance
CREATE INDEX idx_tool_assignments_material_id ON tool_assignments(material_id);
CREATE INDEX idx_tool_assignments_assigned_to ON tool_assignments(assigned_to_name);
CREATE INDEX idx_tool_assignments_status ON tool_assignments(status);
CREATE INDEX idx_tool_assignments_assigned_date ON tool_assignments(assigned_date);

CREATE INDEX idx_tool_maintenance_material_id ON tool_maintenance(material_id);
CREATE INDEX idx_tool_maintenance_scheduled_date ON tool_maintenance(scheduled_date);
CREATE INDEX idx_tool_maintenance_status ON tool_maintenance(status);

CREATE INDEX idx_job_tools_job_id ON job_tools(job_id);
CREATE INDEX idx_job_tools_material_id ON job_tools(material_id);
CREATE INDEX idx_job_tools_status ON job_tools(status);

-- Create function to update tool status when assigned
CREATE OR REPLACE FUNCTION update_tool_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update material tool_status based on assignment
  IF NEW.status = 'active' THEN
    UPDATE materials
    SET tool_status = 'assigned',
        assigned_to = NEW.assigned_to,
        assigned_to_name = NEW.assigned_to_name,
        assigned_date = NEW.assigned_date,
        expected_return_date = NEW.expected_return_date
    WHERE id = NEW.material_id;
  END IF;

  -- If assignment is returned, update material status
  IF NEW.status = 'returned' THEN
    UPDATE materials
    SET tool_status = 'available',
        assigned_to = NULL,
        assigned_to_name = NULL,
        assigned_date = NULL,
        expected_return_date = NULL
    WHERE id = NEW.material_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tool assignment updates
CREATE TRIGGER trigger_update_tool_status_on_assignment
    AFTER INSERT OR UPDATE ON tool_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_tool_status_on_assignment();

-- Create function to automatically schedule next maintenance
CREATE OR REPLACE FUNCTION schedule_next_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only schedule next maintenance if this one was completed and tool has maintenance interval
  IF NEW.status = 'completed' AND NEW.next_maintenance_date IS NOT NULL THEN
    -- Update the material's next maintenance date
    UPDATE materials
    SET last_maintenance_date = NEW.completed_date,
        next_maintenance_date = NEW.next_maintenance_date
    WHERE id = NEW.material_id;

    -- Optionally create the next maintenance record
    INSERT INTO tool_maintenance (
      material_id,
      maintenance_type,
      scheduled_date,
      status
    )
    SELECT
      NEW.material_id,
      NEW.maintenance_type,
      NEW.next_maintenance_date,
      'scheduled'
    WHERE NEW.next_maintenance_date IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenance scheduling
CREATE TRIGGER trigger_schedule_next_maintenance
    AFTER UPDATE ON tool_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION schedule_next_maintenance();

-- Create function to calculate next maintenance date
CREATE OR REPLACE FUNCTION calculate_next_maintenance_date(
  last_date DATE,
  interval_days INTEGER
) RETURNS DATE AS $$
BEGIN
  IF last_date IS NULL OR interval_days IS NULL OR interval_days <= 0 THEN
    RETURN NULL;
  END IF;

  RETURN last_date + INTERVAL '1 day' * interval_days;
END;
$$ LANGUAGE plpgsql;

-- Update existing materials to have tool_status if they're tools
UPDATE materials
SET tool_status = 'available'
WHERE is_tool = true AND tool_status IS NULL;

-- Create view for tool availability
CREATE VIEW tool_availability AS
SELECT
  m.id,
  m.name,
  m.category,
  m.serial_number,
  m.tool_condition,
  m.tool_status,
  m.assigned_to_name,
  m.assigned_date,
  m.expected_return_date,
  CASE
    WHEN m.tool_status = 'available' THEN true
    WHEN m.tool_status = 'assigned' AND m.expected_return_date < NOW() THEN false -- Overdue
    ELSE false
  END as is_available,
  -- Days until next maintenance
  CASE
    WHEN m.next_maintenance_date IS NOT NULL THEN
      (m.next_maintenance_date::date - CURRENT_DATE)::integer
    ELSE NULL
  END as days_until_maintenance
FROM materials m
WHERE m.is_tool = true AND m.is_active = true;