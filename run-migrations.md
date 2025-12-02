# 🔧 Run Database Migrations

To use the Leads & Estimates system, you need to run the database migrations.

## 🚀 Quick Setup (3 Steps)

### **Step 1: Access Supabase SQL Editor**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### **Step 2: Run Leads Migration**

Copy and paste this entire SQL into the SQL editor and click "Run":

```sql
-- Migration 020: Create Leads Table
-- Location: supabase/migrations/020_create_leads_table.sql

-- Create leads table for tracking potential customers
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,

  -- Lead Details
  source TEXT NOT NULL CHECK (source IN (
    'website', 'referral', 'social_media', 'email', 'phone',
    'walk_in', 'advertisement', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'proposal_sent',
    'negotiating', 'converted', 'lost', 'unqualified'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),

  -- Service Details
  service_type TEXT,
  service_description TEXT,
  estimated_value DECIMAL(10, 2),

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Tracking
  assigned_to TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lost_reason TEXT,

  -- Metadata
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_activities table for tracking interactions
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'status_change'
  )),
  description TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();
```

### **Step 3: Run Estimates Migration**

Copy and paste this entire SQL into the SQL editor and click "Run":

```sql
-- Migration 021: Create Estimates Table
-- Location: supabase/migrations/021_create_estimates_table.sql

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
```

## ✅ **Verification**

After running both migrations, verify they worked:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('leads', 'lead_activities', 'estimates', 'estimate_templates');
```

You should see all 4 tables listed!

## 🎯 **What These Migrations Create:**

### **Leads System**

- ✅ `leads` table - Track potential customers
- ✅ `lead_activities` table - Log all interactions
- ✅ 9 indexes - Fast queries
- ✅ Auto-update timestamp trigger

### **Estimates System**

- ✅ `estimates` table - Professional quotes
- ✅ `estimate_templates` table - Reusable templates
- ✅ 8 indexes - Fast queries
- ✅ Auto-generate estimate numbers (EST-0001, EST-0002...)
- ✅ Auto-update timestamp triggers

## 🚀 **After Migration**

Your Leads & Estimates pages will work perfectly:

- Visit `/leads` to manage leads
- Visit `/estimates` to create quotes

---

**Need help?** The SQL is safe to run multiple times (uses `IF NOT EXISTS`).
