-- Create estimates table for quotes/proposals
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number TEXT UNIQUE NOT NULL,
  
  -- Related Records
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Estimate Details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'revised'
  )),
  
  -- Line Items (stored as JSONB)
  line_items JSONB NOT NULL DEFAULT '[]',
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Terms
  valid_until DATE NOT NULL,
  terms_and_conditions TEXT,
  payment_terms TEXT,
  notes TEXT,
  
  -- Tracking
  sent_date TIMESTAMP WITH TIME ZONE,
  viewed_date TIMESTAMP WITH TIME ZONE,
  accepted_date TIMESTAMP WITH TIME ZONE,
  declined_date TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  
  -- Conversion
  converted_to_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimate_templates table for reusable templates
CREATE TABLE IF NOT EXISTS estimate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  default_line_items JSONB NOT NULL DEFAULT '[]',
  default_terms TEXT,
  default_payment_terms TEXT,
  default_valid_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON estimates(lead_id);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_property_id ON estimates(property_id);
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON estimates(valid_until);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_estimate_templates_service_type ON estimate_templates(service_type);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimates_updated_at
BEFORE UPDATE ON estimates
FOR EACH ROW
EXECUTE FUNCTION update_estimates_updated_at();

CREATE TRIGGER estimate_templates_updated_at
BEFORE UPDATE ON estimate_templates
FOR EACH ROW
EXECUTE FUNCTION update_estimates_updated_at();

-- Function to generate estimate number
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM estimates
  WHERE estimate_number LIKE 'EST-%';
  
  new_number := 'EST-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate estimate number
CREATE OR REPLACE FUNCTION set_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    NEW.estimate_number := generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_estimate_number_trigger
BEFORE INSERT ON estimates
FOR EACH ROW
EXECUTE FUNCTION set_estimate_number();
