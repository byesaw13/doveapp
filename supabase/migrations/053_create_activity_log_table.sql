-- Activity log for audit trail
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id),
  actor_role TEXT,
  entity_type TEXT NOT NULL, -- 'job', 'estimate', 'invoice', 'visit', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'paid', etc.
  meta_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_actor ON activity_log(actor_user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view activity in their account" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_memberships am
      WHERE am.user_id = auth.uid()
      AND am.account_id = (SELECT account_id FROM account_memberships WHERE user_id = activity_log.actor_user_id LIMIT 1)
      AND am.is_active = true
    )
  );