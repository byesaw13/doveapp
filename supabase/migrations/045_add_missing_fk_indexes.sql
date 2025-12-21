-- Add missing foreign key indexes for better query performance
-- These indexes improve join performance on commonly queried foreign keys

-- Jobs table: index for property_id (added in migration 005)
create index if not exists jobs_property_id_idx on jobs(property_id) where property_id is not null;

-- Payments table: index for job_id
create index if not exists payments_job_id_idx on payments(job_id);

-- Additional composite indexes for common query patterns

-- Jobs: composite index for client + status (frequent filtering)
create index if not exists jobs_client_status_idx on jobs(client_id, status);

-- Properties: composite index for client + type
create index if not exists properties_client_type_idx on properties(client_id, property_type);

-- Time entries: composite index for job + start_time
create index if not exists time_entries_job_start_time_idx on time_entries(job_id, start_time);

-- Activities: index for client_id (client_activities table)
create index if not exists client_activities_client_id_idx on client_activities(client_id);