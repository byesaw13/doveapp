-- Update job templates table with enhanced schema
-- Drop and recreate with improved structure
DROP TABLE IF EXISTS job_templates CASCADE;

CREATE TABLE job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., 'plumbing', 'electrical', 'hvac', 'painting', etc.
  estimated_duration_hours DECIMAL(6,2), -- Estimated hours to complete
  estimated_cost DECIMAL(10,2), -- Base estimated cost
  default_priority VARCHAR(20) DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),

  -- Template configuration
  template_data JSONB NOT NULL, -- Full job configuration including line items

  -- Metadata
  is_public BOOLEAN DEFAULT false, -- Can be used by all users
  usage_count INTEGER DEFAULT 0, -- How many times this template has been used

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_job_templates_category ON job_templates(category);
CREATE INDEX idx_job_templates_created_by ON job_templates(created_by);
CREATE INDEX idx_job_templates_usage_count ON job_templates(usage_count DESC);
CREATE INDEX idx_job_templates_is_public ON job_templates(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public templates and their own templates"
  ON job_templates FOR SELECT USING (
    is_public = true OR created_by = auth.uid()
  );

CREATE POLICY "Users can create their own templates"
  ON job_templates FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON job_templates FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON job_templates FOR DELETE USING (auth.uid() = created_by);

-- Allow all authenticated users to manage templates (simplified RLS)
-- In a production app, you'd implement proper role-based access control

-- Update trigger
CREATE OR REPLACE FUNCTION update_job_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_templates_updated_at
  BEFORE UPDATE ON job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_templates_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE job_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some default templates
INSERT INTO job_templates (name, description, category, estimated_duration_hours, estimated_cost, default_priority, is_public, template_data) VALUES
(
  'Basic Plumbing Repair',
  'Standard plumbing repair for common household issues',
  'plumbing',
  2.0,
  150.00,
  'medium',
  true,
  '{
    "title": "Plumbing Repair",
    "description": "Diagnosed and repaired plumbing issue",
    "status": "scheduled",
    "line_items": [
      {
        "item_type": "labor",
        "description": "Plumbing diagnosis and repair",
        "quantity": 2,
        "unit_price": 75.00
      },
      {
        "item_type": "material",
        "description": "Replacement parts",
        "quantity": 1,
        "unit_price": 25.00
      }
    ]
  }'::jsonb
),
(
  'Kitchen Faucet Installation',
  'Complete kitchen faucet replacement and installation',
  'plumbing',
  3.0,
  250.00,
  'medium',
  true,
  '{
    "title": "Kitchen Faucet Installation",
    "description": "Replaced old kitchen faucet with new model",
    "status": "scheduled",
    "line_items": [
      {
        "item_type": "labor",
        "description": "Faucet removal and installation",
        "quantity": 3,
        "unit_price": 75.00
      },
      {
        "item_type": "material",
        "description": "New faucet and supply lines",
        "quantity": 1,
        "unit_price": 125.00
      }
    ]
  }'::jsonb
),
(
  'Basic Electrical Outlet Installation',
  'Install new electrical outlet with proper grounding',
  'electrical',
  2.5,
  200.00,
  'high',
  true,
  '{
    "title": "Electrical Outlet Installation",
    "description": "Installed new GFCI electrical outlet",
    "status": "scheduled",
    "line_items": [
      {
        "item_type": "labor",
        "description": "Electrical outlet installation",
        "quantity": 2.5,
        "unit_price": 80.00
      }
    ]
  }'::jsonb
),
(
  'HVAC Filter Replacement',
  'Replace HVAC filters and basic system check',
  'hvac',
  1.0,
  75.00,
  'low',
  true,
  '{
    "title": "HVAC Filter Replacement",
    "description": "Replaced HVAC filters and performed basic system check",
    "status": "scheduled",
    "line_items": [
      {
        "item_type": "labor",
        "description": "Filter replacement and system check",
        "quantity": 1,
        "unit_price": 75.00
      }
    ]
  }'::jsonb
),
(
  'Interior Painting - Single Room',
  'Paint interior of a single room with primer and two coats',
  'painting',
  8.0,
  600.00,
  'medium',
  true,
  '{
    "title": "Interior Room Painting",
    "description": "Complete interior painting of single room",
    "status": "scheduled",
    "line_items": [
      {
        "item_type": "labor",
        "description": "Painting labor (primer + 2 coats)",
        "quantity": 8,
        "unit_price": 65.00
      },
      {
        "item_type": "material",
        "description": "Paint and supplies",
        "quantity": 1,
        "unit_price": 120.00
      }
    ]
  }'::jsonb
);