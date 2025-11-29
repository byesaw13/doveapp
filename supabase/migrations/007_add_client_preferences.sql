-- Add preferences column to existing clients table
-- This allows storing billing preferences, access codes, special instructions, etc.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferences text;