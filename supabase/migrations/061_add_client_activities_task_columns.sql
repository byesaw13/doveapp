-- Add missing columns to client_activities table for task management

ALTER TABLE client_activities
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Add index for due_date queries
CREATE INDEX IF NOT EXISTS idx_client_activities_due_date ON client_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_client_activities_completed_at ON client_activities(completed_at);

-- Add comments
COMMENT ON COLUMN client_activities.due_date IS 'Due date for task-type activities';
COMMENT ON COLUMN client_activities.completed_at IS 'Completion timestamp for task-type activities';