-- Create job_photos table for storing photo metadata
create table job_photos (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  filename text not null,
  original_filename text not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  photo_type text not null check (photo_type in ('before', 'during', 'after', 'other')),
  caption text,
  taken_at timestamptz,
  uploaded_by text, -- Could be user ID in future auth system
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table job_photos enable row level security;

-- Create policy to allow all operations for now (we'll add auth later)
create policy "Allow all operations on job_photos"
  on job_photos
  for all
  using (true)
  with check (true);

-- Create indexes for performance
create index job_photos_job_id_idx on job_photos(job_id);
create index job_photos_photo_type_idx on job_photos(photo_type);
create index job_photos_created_at_idx on job_photos(created_at);

-- Create trigger to auto-update updated_at
create trigger update_job_photos_updated_at
  before update on job_photos
  for each row
  execute function update_updated_at_column();