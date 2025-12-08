-- Create business settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Your Company Name',
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  logo_url TEXT,
  default_estimate_validity_days INTEGER DEFAULT 30,
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  default_payment_terms TEXT DEFAULT 'Payment due within 30 days',
  default_estimate_terms TEXT DEFAULT 'This estimate is valid for 30 days. All work is guaranteed for 90 days. Final pricing may vary based on site conditions.',
  default_invoice_terms TEXT DEFAULT 'Thank you for your business. Please remit payment within 30 days.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO business_settings (company_name) VALUES ('DOVETAILS HANDYMAN');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_settings_updated_at();