-- Job templates for quick job creation
-- Migration: 013_create_job_templates.sql

-- Create job_templates table
CREATE TABLE job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'maintenance', 'repair', 'installation', 'inspection'
  estimated_duration_hours DECIMAL(4,2), -- Estimated time to complete
  estimated_cost DECIMAL(8,2), -- Estimated total cost
  default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,

  -- Template content
  title_template TEXT NOT NULL, -- Template for job title with placeholders like {client_name}
  description_template TEXT, -- Template for job description
  service_date_offset_days INTEGER DEFAULT 0, -- Days from creation to schedule

  -- Default line items (stored as JSON for flexibility)
  default_line_items JSONB DEFAULT '[]',

  -- Metadata
  created_by UUID, -- User who created the template
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active templates
CREATE INDEX idx_job_templates_active ON job_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_job_templates_category ON job_templates(category);

-- Create job_template_usage table to track template usage
CREATE TABLE job_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES job_templates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  used_by UUID, -- User who used the template
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for usage tracking
CREATE INDEX idx_job_template_usage_template ON job_template_usage(template_id);
CREATE INDEX idx_job_template_usage_job ON job_template_usage(job_id);

-- Insert some default job templates
INSERT INTO job_templates (name, description, category, estimated_duration_hours, estimated_cost, title_template, description_template, default_line_items) VALUES
('HVAC Maintenance', 'Regular HVAC system maintenance and inspection', 'maintenance', 2.0, 150.00, '{client_name} - HVAC Maintenance', 'Perform routine maintenance on HVAC system including filter replacement, inspection, and cleaning.', '[{"item_type": "labor", "description": "HVAC Maintenance", "quantity": 2, "unit_price": 75.00}, {"item_type": "material", "description": "HVAC Filter", "quantity": 1, "unit_price": 25.00}]'),

('Plumbing Repair', 'General plumbing repair service', 'repair', 1.5, 120.00, '{client_name} - Plumbing Repair', 'Diagnose and repair plumbing issue as described by client.', '[{"item_type": "labor", "description": "Plumbing Repair", "quantity": 1.5, "unit_price": 80.00}]'),

('Electrical Installation', 'Electrical installation and setup', 'installation', 3.0, 250.00, '{client_name} - Electrical Installation', 'Install electrical components as specified.', '[{"item_type": "labor", "description": "Electrical Installation", "quantity": 3, "unit_price": 85.00}]'),

('Safety Inspection', 'Comprehensive safety inspection', 'inspection', 1.0, 100.00, '{client_name} - Safety Inspection', 'Perform comprehensive safety inspection and provide detailed report.', '[{"item_type": "labor", "description": "Safety Inspection", "quantity": 1, "unit_price": 100.00}]'),

('Appliance Repair', 'Major appliance repair service', 'repair', 2.5, 180.00, '{client_name} - Appliance Repair', 'Repair malfunctioning appliance including diagnosis and parts replacement.', '[{"item_type": "labor", "description": "Appliance Repair", "quantity": 2.5, "unit_price": 75.00}]');

-- Add RLS policies if needed
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_template_usage ENABLE ROW LEVEL SECURITY;

-- Allow all users to read active templates
CREATE POLICY "Allow reading active job templates" ON job_templates
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to create/update templates (adjust as needed)
CREATE POLICY "Allow creating job templates" ON job_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updating job templates" ON job_templates
  FOR UPDATE USING (true);

-- Allow tracking template usage
CREATE POLICY "Allow inserting template usage" ON job_template_usage
  FOR INSERT WITH CHECK (true);