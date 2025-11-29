-- Create properties table
create table properties (
  id uuid default gen_random_uuid() primary key,
  client_id uuid not null references clients(id) on delete cascade,
  name text not null, -- e.g., "Main House", "Summer Cottage", "Office Building"
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  property_type text, -- e.g., "Residential", "Commercial", "Condo", "Apartment"
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table properties enable row level security;

-- Create policy to allow all operations for now (we'll add auth later)
create policy "Allow all operations on properties"
  on properties
  for all
  using (true)
  with check (true);

-- Create trigger to auto-update updated_at
create trigger update_properties_updated_at
  before update on properties
  for each row
  execute function update_updated_at_column();

-- Create indexes for performance
create index properties_client_id_idx on properties(client_id);
create index properties_search_idx on properties using gin(
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(address_line1, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(property_type, '')
  )
);

-- Add property_id to jobs table (optional - jobs can be linked to properties instead of just clients)
alter table jobs add column property_id uuid references properties(id) on delete set null;