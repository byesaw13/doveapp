-- Gmail OAuth connections table
-- Stores Gmail account credentials for the Email Intelligence Engine.
-- A future Gmail sync worker will use these credentials to:
--   1. Fetch new emails from Gmail API
--   2. Parse and normalize email content
--   3. POST to /api/email/intake to add emails to the unified inbox

CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by email address
CREATE INDEX IF NOT EXISTS gmail_connections_email_idx ON gmail_connections (email_address);

-- Index for finding active connections
CREATE INDEX IF NOT EXISTS gmail_connections_active_idx ON gmail_connections (is_active) WHERE is_active = TRUE;

COMMENT ON TABLE gmail_connections IS 'Stores Gmail OAuth credentials for email sync. Used by Gmail worker to fetch emails and route to unified inbox.';
COMMENT ON COLUMN gmail_connections.access_token IS 'Short-lived OAuth access token (expires in ~1 hour). Refresh using refresh_token when expired.';
COMMENT ON COLUMN gmail_connections.refresh_token IS 'Long-lived token used to obtain new access tokens without user re-authentication.';
COMMENT ON COLUMN gmail_connections.token_expires_at IS 'Timestamp when access_token expires. Worker should refresh before this time.';
