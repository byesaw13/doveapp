-- Add read/unread status tracking to emails_raw table
ALTER TABLE emails_raw 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering unread emails
CREATE INDEX IF NOT EXISTS idx_emails_raw_is_read ON emails_raw(is_read);

-- Add starred/flagged support
ALTER TABLE emails_raw
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_emails_raw_is_starred ON emails_raw(is_starred);
