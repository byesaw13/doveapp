-- One-time migration to create properties from existing client addresses
-- Run this AFTER running the 005_create_properties_table.sql migration

-- Insert properties for clients that have address data
INSERT INTO properties (
  client_id,
  name,
  address_line1,
  address_line2,
  city,
  state,
  zip_code,
  property_type,
  notes
)
SELECT
  id as client_id,
  'Primary Residence' as name,
  address_line1,
  address_line2,
  city,
  state,
  zip_code,
  'Residential' as property_type,
  'Migrated from client address data' as notes
FROM clients
WHERE address_line1 IS NOT NULL
  AND address_line1 != ''
  AND city IS NOT NULL
  AND city != '';

-- Optional: Update any existing jobs to link to the newly created properties
-- This would require matching logic based on client_id
-- For now, we'll leave existing jobs as-is (linked only to clients)