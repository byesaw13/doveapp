-- Add permissions column to account_memberships table
-- This allows storing custom permissions for ADMIN users

ALTER TABLE account_memberships
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

-- Add comment explaining the permissions column
COMMENT ON COLUMN account_memberships.permissions IS 'Custom permissions array for ADMIN users. OWNER role gets all permissions by default.';

-- Create index for better performance when querying permissions
CREATE INDEX IF NOT EXISTS idx_account_memberships_permissions
ON account_memberships USING GIN (permissions);