-- Performance optimization indexes
-- Add indexes to improve query performance for common search and filter operations

-- Jobs table: composite index for status + created_at (for filtering and sorting)
create index if not exists jobs_status_created_at_idx on jobs(status, created_at desc);

-- Jobs table: partial index for active jobs (exclude completed/invoiced/cancelled)
create index if not exists jobs_active_status_idx on jobs(status)
where status not in ('completed', 'invoiced', 'cancelled');

-- Jobs table: index for scheduled jobs by date
create index if not exists jobs_scheduled_date_idx on jobs(service_date)
where service_date is not null;

-- Clients table: additional indexes for common queries
create index if not exists clients_name_idx on clients(first_name, last_name);
create index if not exists clients_email_idx on clients(email) where email is not null;
create index if not exists clients_phone_idx on clients(phone) where phone is not null;

-- Estimates table: performance indexes
create index if not exists estimates_status_created_at_idx on estimates(status, created_at desc);
create index if not exists estimates_client_id_idx on estimates(client_id);
create index if not exists estimates_lead_id_idx on estimates(lead_id);

-- Leads table: performance indexes
create index if not exists leads_status_created_at_idx on leads(status, created_at desc);
create index if not exists leads_source_idx on leads(source);

-- Materials table: performance indexes
create index if not exists materials_category_idx on materials(category);
create index if not exists materials_name_idx on materials(name);

-- Time tracking: performance indexes
create index if not exists time_entries_job_id_idx on time_entries(job_id);
create index if not exists time_entries_date_idx on time_entries(date);

-- Job photos: performance indexes
create index if not exists job_photos_job_id_idx on job_photos(job_id);

-- Activities: performance indexes for recent activity queries
create index if not exists activities_created_at_idx on activities(created_at desc);
create index if not exists activities_type_idx on activities(activity_type);