-- FIX: Drop old incomplete leads table and recreate with full schema
-- Run this in Supabase SQL Editor

-- Step 1: Drop the incomplete leads table (and cascading references)
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Step 2: Create leads table with complete schema
CREATE TABLE leads (
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

-- Step 3: Create lead_activities table
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'status_change'
  )),
  description TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at);

-- Step 5: Create update timestamp trigger
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

-- Done! Leads table is now complete.
