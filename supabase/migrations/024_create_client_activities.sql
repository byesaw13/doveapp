-- Create client_activities table to track all interactions with clients
CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  related_id UUID,
  related_type VARCHAR(50),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at ON client_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_activities_related ON client_activities(related_id, related_type);

-- Create updated_at trigger
CREATE TRIGGER update_client_activities_updated_at
  BEFORE UPDATE ON client_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE client_activities IS 'Timeline of all client interactions and events';
COMMENT ON COLUMN client_activities.activity_type IS 'Type of activity: email, call, meeting, note, job_created, job_completed, estimate_sent, estimate_accepted, payment_received, etc.';
COMMENT ON COLUMN client_activities.metadata IS 'Additional data specific to activity type (e.g., email subject, job amount, etc.)';
COMMENT ON COLUMN client_activities.related_id IS 'ID of related record (job, estimate, payment, etc.)';
COMMENT ON COLUMN client_activities.related_type IS 'Type of related record (job, estimate, payment, etc.)';
