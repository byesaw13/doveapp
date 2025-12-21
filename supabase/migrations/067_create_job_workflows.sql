-- Create job workflows table for automated status-based actions
CREATE TABLE IF NOT EXISTS job_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_status VARCHAR(50) NOT NULL CHECK (trigger_status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  is_active BOOLEAN DEFAULT true,

  -- Actions to perform
  actions JSONB NOT NULL, -- Array of actions to execute

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for performance
CREATE INDEX idx_job_workflows_trigger_status ON job_workflows(trigger_status) WHERE is_active = true;

-- Enable RLS
ALTER TABLE job_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view active workflows"
  ON job_workflows FOR SELECT USING (true);

CREATE POLICY "Users can create workflows"
  ON job_workflows FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their workflows"
  ON job_workflows FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their workflows"
  ON job_workflows FOR DELETE USING (auth.uid() = created_by);

-- Update trigger
CREATE OR REPLACE FUNCTION update_job_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_workflows_updated_at
  BEFORE UPDATE ON job_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_job_workflows_updated_at();

-- Create job workflow executions table to track what happened
CREATE TABLE IF NOT EXISTS job_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES job_workflows(id) ON DELETE CASCADE,
  trigger_status VARCHAR(50) NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Results
  actions_executed JSONB, -- What actions were performed
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_job_workflow_executions_job_id ON job_workflow_executions(job_id);
CREATE INDEX idx_job_workflow_executions_workflow_id ON job_workflow_executions(workflow_id);
CREATE INDEX idx_job_workflow_executions_executed_at ON job_workflow_executions(executed_at DESC);

-- Function to execute workflow actions
CREATE OR REPLACE FUNCTION execute_job_workflow(job_uuid UUID, workflow_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  job_record RECORD;
  workflow_record RECORD;
  actions_result JSONB := '[]';
  action_result JSONB;
BEGIN
  -- Get job and workflow details
  SELECT * INTO job_record FROM jobs WHERE id = job_uuid;
  SELECT * INTO workflow_record FROM job_workflows WHERE id = workflow_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Job or workflow not found');
  END IF;

  -- Execute each action in the workflow
  FOR action_result IN SELECT * FROM jsonb_array_elements(workflow_record.actions)
  LOOP
    -- Here you would implement different action types
    -- For now, we'll just log what would happen
    actions_result := actions_result || jsonb_build_object(
      'action_type', action_result->>'type',
      'executed_at', NOW(),
      'status', 'simulated'
    );
  END LOOP;

  -- Record the execution
  INSERT INTO job_workflow_executions (
    job_id,
    workflow_id,
    trigger_status,
    actions_executed,
    success
  ) VALUES (
    job_uuid,
    workflow_uuid,
    job_record.status,
    actions_result,
    true
  );

  RETURN actions_result;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger workflows when job status changes
CREATE OR REPLACE FUNCTION trigger_job_workflows()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  result JSONB;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Find and execute workflows for this status
  FOR workflow_record IN
    SELECT * FROM job_workflows
    WHERE trigger_status = NEW.status
    AND is_active = true
  LOOP
    -- Execute the workflow
    SELECT execute_job_workflow(NEW.id, workflow_record.id) INTO result;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on jobs table
CREATE TRIGGER job_status_change_workflows
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_job_workflows();

-- Insert default workflows
INSERT INTO job_workflows (name, description, trigger_status, is_active, actions) VALUES
(
  'Job Completed Notification',
  'Send notification when job is marked as completed',
  'completed',
  true,
  '[
    {
      "type": "notification",
      "title": "Job Completed",
      "message": "Job has been marked as completed",
      "recipients": ["technician", "admin"]
    },
    {
      "type": "invoice_generation",
      "auto_generate": true,
      "due_days": 30
    }
  ]'::jsonb
),
(
  'Job Scheduled Reminder',
  'Send reminder 24 hours before scheduled job',
  'scheduled',
  true,
  '[
    {
      "type": "schedule_reminder",
      "hours_before": 24,
      "message": "Job scheduled for tomorrow"
    }
  ]'::jsonb
),
(
  'Job Started Notification',
  'Notify when job status changes to in progress',
  'in_progress',
  true,
  '[
    {
      "type": "notification",
      "title": "Job Started",
      "message": "Job has been started",
      "recipients": ["admin"]
    }
  ]'::jsonb
);