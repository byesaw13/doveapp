-- Add composite indexes for better query performance
-- These indexes optimize common query patterns in the application

-- Jobs table composite indexes
-- Optimize: SELECT * FROM jobs WHERE client_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_jobs_client_status 
  ON jobs(client_id, status);

-- Optimize: SELECT * FROM jobs WHERE status = ? ORDER BY service_date
CREATE INDEX IF NOT EXISTS idx_jobs_status_service_date 
  ON jobs(status, service_date) 
  WHERE service_date IS NOT NULL;

-- Optimize: SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
  ON jobs(status, created_at DESC);

-- Invoices table composite indexes
-- Optimize: SELECT * FROM invoices WHERE status = ? ORDER BY due_date
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date 
  ON invoices(status, due_date);

-- Optimize: SELECT * FROM invoices WHERE client_id = ? AND status != 'paid'
CREATE INDEX IF NOT EXISTS idx_invoices_client_status 
  ON invoices(client_id, status);

-- Optimize: SELECT * FROM invoices WHERE status != 'paid' ORDER BY due_date
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding 
  ON invoices(due_date) 
  WHERE status != 'paid';

-- Estimates table composite indexes
-- Optimize: SELECT * FROM estimates WHERE client_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_estimates_client_status 
  ON estimates(client_id, status);

-- Optimize: SELECT * FROM estimates WHERE status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_estimates_status_created 
  ON estimates(status, created_at DESC);

-- Client Activities table composite indexes
-- Optimize: SELECT * FROM client_activities WHERE client_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_client_activities_client_created 
  ON client_activities(client_id, created_at DESC);

-- Optimize: SELECT * FROM client_activities WHERE activity_type = ? AND client_id = ?
CREATE INDEX IF NOT EXISTS idx_client_activities_type_client 
  ON client_activities(activity_type, client_id);

-- Job line items - optimize for job lookups
CREATE INDEX IF NOT EXISTS idx_job_line_items_job_created 
  ON job_line_items(job_id, created_at);

-- Invoice line items - optimize for invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_created 
  ON invoice_line_items(invoice_id, created_at);

-- Payments table - optimize for job payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_job_created 
  ON payments(job_id, created_at DESC);

-- Invoice payments - optimize for invoice payment lookups  
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_created 
  ON invoice_payments(invoice_id, created_at DESC);

-- Add index on email for faster client lookups
CREATE INDEX IF NOT EXISTS idx_clients_email 
  ON clients(email) 
  WHERE email IS NOT NULL;

-- Add index on phone for faster client lookups
CREATE INDEX IF NOT EXISTS idx_clients_phone 
  ON clients(phone) 
  WHERE phone IS NOT NULL;

-- Analyze tables to update statistics for query planner
ANALYZE jobs;
ANALYZE invoices;
ANALYZE estimates;
ANALYZE clients;
ANALYZE client_activities;
ANALYZE job_line_items;
ANALYZE invoice_line_items;
ANALYZE payments;
ANALYZE invoice_payments;

-- Note: These indexes will improve read performance but may slightly slow down writes
-- Monitor query performance and adjust as needed based on actual usage patterns
