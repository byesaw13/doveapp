-- Gmail Connections Table for persistent OAuth tokens
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be expanded when user auth is added)
CREATE POLICY "Allow all operations on gmail_connections" ON gmail_connections FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_gmail_connections_email ON gmail_connections(email_address);
CREATE INDEX idx_gmail_connections_active ON gmail_connections(is_active);