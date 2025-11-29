-- Create jobs table
create table jobs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid not null references clients(id) on delete cascade,
  job_number text unique not null,
  title text not null,
  description text,
  status text not null check (status in ('quote', 'scheduled', 'in_progress', 'completed', 'invoiced', 'cancelled')),
  service_date date,
  scheduled_time time,
  subtotal decimal(10,2) default 0,
  tax decimal(10,2) default 0,
  total decimal(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create job_line_items table for labor and materials
create table job_line_items (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  item_type text not null check (item_type in ('labor', 'material')),
  description text not null,
  quantity decimal(10,2) not null default 1,
  unit_price decimal(10,2) not null,
  total decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table jobs enable row level security;
alter table job_line_items enable row level security;

-- Create policies
create policy "Allow all operations on jobs"
  on jobs for all using (true) with check (true);

create policy "Allow all operations on job_line_items"
  on job_line_items for all using (true) with check (true);

-- Create triggers for updated_at
create trigger update_jobs_updated_at
  before update on jobs
  for each row
  execute function update_updated_at_column();

-- Create indexes
create index jobs_client_id_idx on jobs(client_id);
create index jobs_status_idx on jobs(status);
create index jobs_service_date_idx on jobs(service_date);
create index jobs_job_number_idx on jobs(job_number);
create index job_line_items_job_id_idx on job_line_items(job_id);

-- Function to generate job numbers
create or replace function generate_job_number()
returns text as $$
declare
  next_num int;
  job_num text;
begin
  -- Get the next number based on existing jobs
  select coalesce(max(cast(substring(job_number from '[0-9]+') as int)), 0) + 1
  into next_num
  from jobs
  where job_number ~ '^JOB-[0-9]+$';
  
  job_num := 'JOB-' || lpad(next_num::text, 5, '0');
  return job_num;
end;
$$ language plpgsql;
