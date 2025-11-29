-- Create square_connections table to store OAuth tokens
create table square_connections (
  id uuid default gen_random_uuid() primary key,
  merchant_id text unique not null,
  access_token text not null,
  refresh_token text,
  expires_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table square_connections enable row level security;

-- Create policy to allow all operations (single-user app for now)
create policy "Allow all operations on square_connections"
  on square_connections
  for all
  using (true)
  with check (true);

-- Create trigger to auto-update updated_at
create trigger update_square_connections_updated_at
  before update on square_connections
  for each row
  execute function update_updated_at_column();

-- Create index for merchant_id lookups
create index square_connections_merchant_id_idx on square_connections(merchant_id);
