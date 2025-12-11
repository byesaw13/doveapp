-- Add status column to conversations table for inbox management
-- Allows marking conversations as 'open' or 'closed' to keep inbox clean
-- Default 'open' for existing conversations

-- Check if status column already exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE conversations
        ADD COLUMN status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed'));
    END IF;
END $$;

-- Index for efficient filtering by status
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations (status);

COMMENT ON COLUMN conversations.status IS 'Conversation status for inbox management: open (active) or closed (done)';
COMMENT ON TABLE conversations IS 'Customer conversations with status for inbox organization';