-- Add junk category to email_messages table
-- Migration: 016_add_junk_email_category.sql

-- Update the category check constraint to include 'junk'
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_category_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_category_check
  CHECK (category IN ('unreviewed', 'spending', 'billing', 'leads', 'other', 'ignored', 'junk'));

-- Update index to include junk category
DROP INDEX IF EXISTS idx_email_messages_category;
CREATE INDEX idx_email_messages_category ON email_messages(category);