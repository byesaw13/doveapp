-- Add payment_status to jobs table
alter table jobs add column payment_status text not null default 'unpaid' 
  check (payment_status in ('unpaid', 'partial', 'paid'));

alter table jobs add column amount_paid decimal(10,2) default 0;

-- Create payments table
create table payments (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_method text,
  payment_date date not null,
  notes text,
  square_payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table payments enable row level security;

-- Create policy
create policy "Allow all operations on payments"
  on payments for all using (true) with check (true);

-- Create trigger for updated_at
create trigger update_payments_updated_at
  before update on payments
  for each row
  execute function update_updated_at_column();

-- Create indexes
create index payments_job_id_idx on payments(job_id);
create index payments_payment_date_idx on payments(payment_date);
create index payments_square_payment_id_idx on payments(square_payment_id);

-- Function to update job payment status after payment changes
create or replace function update_job_payment_status()
returns trigger as $$
declare
  job_total decimal(10,2);
  total_paid decimal(10,2);
begin
  -- Get job total
  select total into job_total from jobs where id = new.job_id;
  
  -- Calculate total paid
  select coalesce(sum(amount), 0) into total_paid 
  from payments 
  where job_id = new.job_id;
  
  -- Update job payment status
  update jobs
  set 
    amount_paid = total_paid,
    payment_status = case
      when total_paid = 0 then 'unpaid'
      when total_paid >= job_total then 'paid'
      else 'partial'
    end
  where id = new.job_id;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to update payment status after insert
create trigger update_job_payment_after_insert
  after insert on payments
  for each row
  execute function update_job_payment_status();

-- Trigger to update payment status after update
create trigger update_job_payment_after_update
  after update on payments
  for each row
  execute function update_job_payment_status();

-- Trigger to update payment status after delete
create or replace function update_job_payment_status_on_delete()
returns trigger as $$
declare
  job_total decimal(10,2);
  total_paid decimal(10,2);
begin
  -- Get job total
  select total into job_total from jobs where id = old.job_id;
  
  -- Calculate total paid (excluding deleted payment)
  select coalesce(sum(amount), 0) into total_paid 
  from payments 
  where job_id = old.job_id and id != old.id;
  
  -- Update job payment status
  update jobs
  set 
    amount_paid = total_paid,
    payment_status = case
      when total_paid = 0 then 'unpaid'
      when total_paid >= job_total then 'paid'
      else 'partial'
    end
  where id = old.job_id;
  
  return old;
end;
$$ language plpgsql;

create trigger update_job_payment_after_delete
  after delete on payments
  for each row
  execute function update_job_payment_status_on_delete();
