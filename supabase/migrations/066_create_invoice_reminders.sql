-- Create invoice reminders table for automated follow-ups
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('due_date_approaching', 'overdue', 'final_notice', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),

  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Content
  subject TEXT,
  message TEXT,

  -- Metadata
  sent_via VARCHAR(50), -- 'email', 'sms', etc.
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  error_message TEXT,

  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_status ON invoice_reminders(status);
CREATE INDEX idx_invoice_reminders_scheduled_for ON invoice_reminders(scheduled_for);
CREATE INDEX idx_invoice_reminders_type ON invoice_reminders(reminder_type);

-- Enable RLS
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified - allow all authenticated users)
CREATE POLICY "Users can view reminders for their invoices"
  ON invoice_reminders FOR SELECT USING (true);

CREATE POLICY "Users can create reminders for their invoices"
  ON invoice_reminders FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update reminders for their invoices"
  ON invoice_reminders FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete reminders for their invoices"
  ON invoice_reminders FOR DELETE USING (auth.uid() = created_by);

-- Update trigger
CREATE OR REPLACE FUNCTION update_invoice_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_reminders_updated_at
  BEFORE UPDATE ON invoice_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_reminders_updated_at();

-- Function to automatically create invoice reminders
CREATE OR REPLACE FUNCTION create_invoice_reminders(target_invoice_id UUID)
RETURNS INTEGER AS $$
DECLARE
  invoice_record RECORD;
  reminder_count INTEGER := 0;
  due_date_approaching TIMESTAMP;
  overdue_date TIMESTAMP;
  final_notice_date TIMESTAMP;
BEGIN
  -- Get invoice details
  SELECT * INTO invoice_record
  FROM invoices
  WHERE id = target_invoice_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate reminder dates
  due_date_approaching := invoice_record.due_date - INTERVAL '3 days';
  overdue_date := invoice_record.due_date + INTERVAL '1 day';
  final_notice_date := invoice_record.due_date + INTERVAL '7 days';

  -- Create reminder for due date approaching (3 days before)
  IF due_date_approaching > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'due_date_approaching',
      due_date_approaching,
      'Invoice Due Soon - ' || invoice_record.invoice_number,
      'Your invoice ' || invoice_record.invoice_number || ' is due in 3 days. Please arrange payment to avoid late fees.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  -- Create overdue reminder (1 day after due date)
  IF overdue_date > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'overdue',
      overdue_date,
      'OVERDUE: Invoice ' || invoice_record.invoice_number,
      'Your invoice ' || invoice_record.invoice_number || ' is now overdue. Please remit payment immediately.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  -- Create final notice (7 days after due date)
  IF final_notice_date > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'final_notice',
      final_notice_date,
      'FINAL NOTICE: Invoice ' || invoice_record.invoice_number,
      'This is your final notice for invoice ' || invoice_record.invoice_number || '. Immediate payment is required.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  RETURN reminder_count;
END;
$$ LANGUAGE plpgsql;

-- Function to process pending reminders (call this periodically)
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS INTEGER AS $$
DECLARE
  reminder_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process reminders that are due
  FOR reminder_record IN
    SELECT * FROM invoice_reminders
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
  LOOP
    -- Here you would integrate with your email service
    -- For now, we'll just mark as sent
    UPDATE invoice_reminders
    SET
      status = 'sent',
      sent_at = NOW(),
      sent_via = 'email'
    WHERE id = reminder_record.id;

    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create reminders when invoices are created
CREATE OR REPLACE FUNCTION auto_create_invoice_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminders for sent invoices
  IF NEW.status = 'sent' AND NEW.due_date IS NOT NULL THEN
    PERFORM create_invoice_reminders(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_invoice_reminders_trigger
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invoice_reminders();