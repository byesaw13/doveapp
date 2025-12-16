-- Add policies to allow admins to manage global AI estimate settings

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own estimate settings" ON ai_estimate_settings;
DROP POLICY IF EXISTS "Users can update their own estimate settings" ON ai_estimate_settings;

-- Allow users to insert their own settings OR admins to insert global settings
CREATE POLICY "Users can insert estimate settings" ON ai_estimate_settings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR (user_id IS NULL AND EXISTS (
      SELECT 1 FROM account_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('OWNER', 'ADMIN')
    ))
  );

-- Allow users to update their own settings OR admins to update global settings
CREATE POLICY "Users can update estimate settings" ON ai_estimate_settings
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND EXISTS (
      SELECT 1 FROM account_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('OWNER', 'ADMIN')
    ))
  );