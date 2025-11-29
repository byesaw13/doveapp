-- Create clients table
create table clients (
  id uuid default gen_random_uuid() primary key,
  square_customer_id text unique,
  first_name text not null,
  last_name text not null,
  company_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  notes text,
  preferences text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table clients enable row level security;

-- Create policy to allow all operations for now (we'll add auth later)
create policy "Allow all operations on clients"
  on clients
  for all
  using (true)
  with check (true);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to auto-update updated_at
create trigger update_clients_updated_at
  before update on clients
  for each row
  execute function update_updated_at_column();

-- Create index for searching
create index clients_search_idx on clients using gin(
  to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(company_name, '') || ' ' ||
    coalesce(email, '')
  )
);

-- Create index for Square customer ID lookups
create index clients_square_id_idx on clients(square_customer_id);
