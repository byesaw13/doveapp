-- Create contact_requests table for customer contact forms
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own contact requests" ON contact_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contact requests" ON contact_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_memberships am
      WHERE am.user_id = auth.uid()
      AND am.role IN ('admin', 'owner')
      AND am.is_active = true
    )
  );

-- Create indexes
CREATE INDEX idx_contact_requests_user_id ON contact_requests(user_id);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();