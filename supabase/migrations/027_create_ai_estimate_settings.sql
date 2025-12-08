-- Create AI Estimate Settings table
-- Stores configurable settings for AI-powered estimate generation

CREATE TABLE IF NOT EXISTS ai_estimate_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profit & Pricing
  default_profit_margin DECIMAL(5,2) NOT NULL DEFAULT 25.00 CHECK (default_profit_margin >= 0 AND default_profit_margin <= 100),
  markup_on_materials DECIMAL(5,2) NOT NULL DEFAULT 15.00 CHECK (markup_on_materials >= 0),
  markup_on_subcontractors DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (markup_on_subcontractors >= 0),

  -- Labor Rates
  hourly_labor_rate DECIMAL(8,2) NOT NULL DEFAULT 25.00 CHECK (hourly_labor_rate > 0),
  billable_hourly_rate DECIMAL(8,2) NOT NULL DEFAULT 75.00 CHECK (billable_hourly_rate > 0),
  overtime_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.50 CHECK (overtime_multiplier >= 1),

  -- Material Costs
  material_markup_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (material_markup_percentage >= 0),
  equipment_rental_rate DECIMAL(8,2) NOT NULL DEFAULT 50.00 CHECK (equipment_rental_rate >= 0),
  fuel_surcharge_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (fuel_surcharge_percentage >= 0),

  -- Overhead & Expenses
  overhead_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00 CHECK (overhead_percentage >= 0 AND overhead_percentage <= 100),
  insurance_percentage DECIMAL(5,2) NOT NULL DEFAULT 3.00 CHECK (insurance_percentage >= 0),
  administrative_fee DECIMAL(8,2) NOT NULL DEFAULT 50.00 CHECK (administrative_fee >= 0),
  permit_fees DECIMAL(8,2) NOT NULL DEFAULT 100.00 CHECK (permit_fees >= 0),
  disposal_fees DECIMAL(8,2) NOT NULL DEFAULT 25.00 CHECK (disposal_fees >= 0),

  -- Tax Settings
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 8.50 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),
  taxable_labor BOOLEAN NOT NULL DEFAULT true,
  taxable_materials BOOLEAN NOT NULL DEFAULT true,

  -- Business Rules
  minimum_job_size DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (minimum_job_size >= 0),
  round_to_nearest DECIMAL(8,2) NOT NULL DEFAULT 5.00 CHECK (round_to_nearest > 0),
  include_contingency BOOLEAN NOT NULL DEFAULT true,
  contingency_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (contingency_percentage >= 0),

  -- Service-specific rates (stored as JSONB)
  service_rates JSONB NOT NULL DEFAULT '{
    "painting": {
      "labor_rate_per_sqft": 2.50,
      "material_cost_per_sqft": 1.25,
      "primer_included": true
    },
    "plumbing": {
      "hourly_rate": 85.00,
      "trip_fee": 75.00,
      "emergency_multiplier": 2.00
    },
    "electrical": {
      "hourly_rate": 90.00,
      "permit_fee": 150.00,
      "inspection_fee": 100.00
    },
    "hvac": {
      "hourly_rate": 95.00,
      "diagnostic_fee": 125.00,
      "refrigerant_cost_per_lb": 15.00
    },
    "general": {
      "hourly_rate": 75.00,
      "minimum_charge": 150.00
    }
  }',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_estimate_settings_user_id ON ai_estimate_settings(user_id);

-- Create unique constraint to ensure only one settings record per user
-- Allow NULL user_id for global defaults
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_estimate_settings_user_unique
ON ai_estimate_settings(user_id) WHERE user_id IS NOT NULL;

-- Insert default global settings (user_id = NULL)
INSERT INTO ai_estimate_settings (
  user_id,
  default_profit_margin,
  markup_on_materials,
  markup_on_subcontractors,
  hourly_labor_rate,
  billable_hourly_rate,
  overtime_multiplier,
  material_markup_percentage,
  equipment_rental_rate,
  fuel_surcharge_percentage,
  overhead_percentage,
  insurance_percentage,
  administrative_fee,
  permit_fees,
  disposal_fees,
  default_tax_rate,
  taxable_labor,
  taxable_materials,
  minimum_job_size,
  round_to_nearest,
  include_contingency,
  contingency_percentage
) VALUES (
  NULL, -- Global defaults
  25.00, -- default_profit_margin
  15.00, -- markup_on_materials
  10.00, -- markup_on_subcontractors
  25.00, -- hourly_labor_rate
  75.00, -- billable_hourly_rate
  1.50, -- overtime_multiplier
  20.00, -- material_markup_percentage
  50.00, -- equipment_rental_rate
  5.00, -- fuel_surcharge_percentage
  15.00, -- overhead_percentage
  3.00, -- insurance_percentage
  50.00, -- administrative_fee
  100.00, -- permit_fees
  25.00, -- disposal_fees
  8.50, -- default_tax_rate
  true, -- taxable_labor
  true, -- taxable_materials
  500.00, -- minimum_job_size
  5.00, -- round_to_nearest
  true, -- include_contingency
  10.00 -- contingency_percentage
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_estimate_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_estimate_settings_updated_at
  BEFORE UPDATE ON ai_estimate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_estimate_settings_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE ai_estimate_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own settings or global settings
CREATE POLICY "Users can view their own estimate settings" ON ai_estimate_settings
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can only insert their own settings
CREATE POLICY "Users can insert their own estimate settings" ON ai_estimate_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own settings
CREATE POLICY "Users can update their own estimate settings" ON ai_estimate_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own settings
CREATE POLICY "Users can delete their own estimate settings" ON ai_estimate_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE ai_estimate_settings IS 'Configurable settings for AI-powered estimate generation including profit margins, labor rates, and business rules';