-- Create email templates table for customizable invoice and estimate emails
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('invoice', 'estimate', 'general')),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  variables JSONB DEFAULT '[]', -- Array of available variables
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create unique constraint for default templates per type
CREATE UNIQUE INDEX idx_email_templates_default_type
ON email_templates(type, is_default)
WHERE is_default = true;

-- Create index for faster lookups
CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);

-- Insert default templates
INSERT INTO email_templates (name, type, subject_template, body_template, is_default, variables) VALUES
(
  'Default Invoice',
  'invoice',
  'Invoice {{invoice_number}} from {{company_name}}',
  'Dear {{client_name}},

We hope this email finds you well. Please find attached your invoice {{invoice_number}} for ${{total_amount}}.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Issue Date: {{issue_date}}
- Due Date: {{due_date}}
- Total Amount: ${{total_amount}}
- Amount Due: ${{balance_due}}

Please remit payment by the due date to avoid any late fees.

If you have any questions about this invoice, please don''t hesitate to contact us.

Best regards,
{{company_name}}
{{company_email}}
{{company_phone}}',
  true,
  '["invoice_number", "company_name", "client_name", "total_amount", "issue_date", "due_date", "balance_due", "company_email", "company_phone"]'::jsonb
),
(
  'Default Estimate',
  'estimate',
  'Estimate {{estimate_id}} from {{company_name}}',
  'Dear {{client_name}},

Thank you for considering {{company_name}} for your project. Please find attached our estimate for the work discussed.

Estimate Details:
- Estimate ID: {{estimate_id}}
- Project: {{title}}
- Total Amount: ${{total_amount}}
- Valid Until: {{valid_until}}

This estimate includes all the work we discussed and is valid for 30 days from the date of this email.

Please review the attached estimate and let us know if you have any questions or would like to proceed.

We look forward to working with you!

Best regards,
{{company_name}}
{{company_email}}
{{company_phone}}',
  true,
  '["estimate_id", "company_name", "client_name", "title", "total_amount", "valid_until", "company_email", "company_phone"]'::jsonb
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all email templates"
  ON email_templates FOR SELECT USING (true);

CREATE POLICY "Users can insert their own email templates"
  ON email_templates FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own email templates"
  ON email_templates FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own email templates"
  ON email_templates FOR DELETE USING (auth.uid() = created_by);

-- Allow all authenticated users to manage templates (simplified RLS)
-- In a production app, you'd implement proper role-based access control

-- Update trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();