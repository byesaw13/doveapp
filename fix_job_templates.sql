-- Fix job templates table - add missing usage_count column
-- This handles the case where the table was created but the column is missing

DO $$
BEGIN
  -- Check if usage_count column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_templates'
    AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE job_templates ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_job_templates_category ON job_templates(category);
CREATE INDEX IF NOT EXISTS idx_job_templates_created_by ON job_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_job_templates_usage_count ON job_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_job_templates_is_public ON job_templates(is_public) WHERE is_public = true;

-- Insert default templates (only if they don't already exist)
INSERT INTO job_templates (name, description, category, estimated_duration_hours, estimated_cost, default_priority, is_public, template_data)
SELECT * FROM (VALUES
(
  'Basic Plumbing Repair',
  'Standard plumbing repair for common household issues',
  'plumbing'::VARCHAR,
  2.0::DECIMAL,
  150.00::DECIMAL,
  'medium'::VARCHAR,
  true::BOOLEAN,
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
  'plumbing'::VARCHAR,
  3.0::DECIMAL,
  250.00::DECIMAL,
  'medium'::VARCHAR,
  true::BOOLEAN,
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
  'electrical'::VARCHAR,
  2.5::DECIMAL,
  200.00::DECIMAL,
  'high'::VARCHAR,
  true::BOOLEAN,
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
  'hvac'::VARCHAR,
  1.0::DECIMAL,
  75.00::DECIMAL,
  'low'::VARCHAR,
  true::BOOLEAN,
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
  'painting'::VARCHAR,
  8.0::DECIMAL,
  600.00::DECIMAL,
  'medium'::VARCHAR,
  true::BOOLEAN,
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
)
) AS v(name, description, category, estimated_duration_hours, estimated_cost, default_priority, is_public, template_data)
WHERE NOT EXISTS (
  SELECT 1 FROM job_templates WHERE name = v.name
);