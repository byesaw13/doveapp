-- Create Security Settings table
-- Stores comprehensive security, compliance, and audit configurations

CREATE TABLE IF NOT EXISTS security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Password Policy
  password_policy JSONB NOT NULL DEFAULT '{
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": false,
    "password_expiry_days": 90
  }',

  -- Session Policy
  session_policy JSONB NOT NULL DEFAULT '{
    "session_timeout_minutes": 480,
    "max_concurrent_sessions": 5,
    "require_2fa": false,
    "remember_me_days": 30
  }',

  -- Audit Policy
  audit_policy JSONB NOT NULL DEFAULT '{
    "enable_audit_logging": true,
    "log_sensitive_actions": true,
    "retention_days": 365,
    "export_audit_logs": true
  }',

  -- Compliance Policy
  compliance_policy JSONB NOT NULL DEFAULT '{
    "data_retention_years": 7,
    "gdpr_compliance": false,
    "hipaa_compliance": false,
    "enable_data_anonymization": false,
    "require_consent": true
  }',

  -- Encryption Policy
  encryption_policy JSONB NOT NULL DEFAULT '{
    "encrypt_sensitive_data": true,
    "encryption_algorithm": "AES-256",
    "key_rotation_days": 90,
    "backup_encryption": true
  }',

  -- Access Policy
  access_policy JSONB NOT NULL DEFAULT '{
    "allow_api_access": true,
    "rate_limiting_enabled": true,
    "max_requests_per_minute": 100,
    "ip_whitelist_enabled": false,
    "allowed_ips": []
  }',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_settings_created_at ON security_settings(created_at);

-- Insert default global security settings
INSERT INTO security_settings (
  password_policy,
  session_policy,
  audit_policy,
  compliance_policy,
  encryption_policy,
  access_policy
) VALUES (
  '{
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": false,
    "password_expiry_days": 90
  }',
  '{
    "session_timeout_minutes": 480,
    "max_concurrent_sessions": 5,
    "require_2fa": false,
    "remember_me_days": 30
  }',
  '{
    "enable_audit_logging": true,
    "log_sensitive_actions": true,
    "retention_days": 365,
    "export_audit_logs": true
  }',
  '{
    "data_retention_years": 7,
    "gdpr_compliance": false,
    "hipaa_compliance": false,
    "enable_data_anonymization": false,
    "require_consent": true
  }',
  '{
    "encrypt_sensitive_data": true,
    "encryption_algorithm": "AES-256",
    "key_rotation_days": 90,
    "backup_encryption": true
  }',
  '{
    "allow_api_access": true,
    "rate_limiting_enabled": true,
    "max_requests_per_minute": 100,
    "ip_whitelist_enabled": false,
    "allowed_ips": []
  }'
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_security_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_settings_updated_at
  BEFORE UPDATE ON security_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_settings_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only OWNER and ADMIN can view security settings
CREATE POLICY "Security settings access" ON security_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_memberships
      WHERE user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
    )
  );

-- Add comment
COMMENT ON TABLE security_settings IS 'Comprehensive security, compliance, and audit configurations for the application';