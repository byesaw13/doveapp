-- Create Audit Log table
-- Tracks all security-relevant actions and system events

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Add RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only OWNER and ADMIN can view audit logs
CREATE POLICY "Audit log access" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
    )
  );

-- Policy: System can insert audit logs (for automated logging)
CREATE POLICY "Audit log insertion" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of security-relevant actions and system events';