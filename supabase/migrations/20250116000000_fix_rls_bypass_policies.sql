-- Fix RLS bypass policies by restricting to service_role only
-- This prevents authenticated users from bypassing tenant isolation

-- account_memberships
DROP POLICY IF EXISTS "Allow all operations on account_memberships" ON account_memberships;
CREATE POLICY "Allow all operations on account_memberships" ON account_memberships
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- clients
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- customers
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- estimates
DROP POLICY IF EXISTS "Allow all operations on estimates" ON estimates;
CREATE POLICY "Allow all operations on estimates" ON estimates
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- invoices
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
CREATE POLICY "Allow all operations on invoices" ON invoices
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- jobs
DROP POLICY IF EXISTS "Allow all operations on jobs" ON jobs;
CREATE POLICY "Allow all operations on jobs" ON jobs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
CREATE POLICY "Allow all operations on leads" ON leads
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- properties
DROP POLICY IF EXISTS "Allow all operations on properties" ON properties;
CREATE POLICY "Allow all operations on properties" ON properties
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- technician_locations
DROP POLICY IF EXISTS "Allow all operations on technician_locations" ON technician_locations;
CREATE POLICY "Allow all operations on technician_locations" ON technician_locations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- time_entries
DROP POLICY IF EXISTS "Allow all operations on time_entries" ON time_entries;
CREATE POLICY "Allow all operations on time_entries" ON time_entries
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- technician_rates
DROP POLICY IF EXISTS "Allow all operations on technician_rates" ON technician_rates;
CREATE POLICY "Allow all operations on technician_rates" ON technician_rates
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- time_approvals
DROP POLICY IF EXISTS "Allow all operations on time_approvals" ON time_approvals;
CREATE POLICY "Allow all operations on time_approvals" ON time_approvals
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- time_breaks
DROP POLICY IF EXISTS "Allow all operations on time_breaks" ON time_breaks;
CREATE POLICY "Allow all operations on time_breaks" ON time_breaks
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- visits
DROP POLICY IF EXISTS "Allow all operations on visits" ON visits;
CREATE POLICY "Allow all operations on visits" ON visits
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);