-- Add password change tracking to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN users.must_change_password IS 'Flag to force password change on next login';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
