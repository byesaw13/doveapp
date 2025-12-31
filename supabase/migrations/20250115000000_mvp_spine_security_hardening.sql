-- MVP Spine Security Hardening
-- Enforce tenant isolation with account_id + RLS, remove broad policies, and revoke anon grants.

-- -------------------------------------------------------------------
-- Helper functions for consistent RLS checks
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_is_account_member(account_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships
    WHERE account_id = account_uuid
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_account_staff(account_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships
    WHERE account_id = account_uuid
      AND user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN', 'TECH')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_account_tech(account_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships
    WHERE account_id = account_uuid
      AND user_id = auth.uid()
      AND role = 'TECH'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM public.customers
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_customer_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT account_id
  FROM public.customers
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- -------------------------------------------------------------------
-- Ensure account_id exists where required by MVP spine
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS account_id uuid;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS account_id uuid;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.emails_raw ADD COLUMN IF NOT EXISTS account_id uuid;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    ALTER TABLE public.email_insights ADD COLUMN IF NOT EXISTS account_id uuid;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    ALTER TABLE public.email_lead_details ADD COLUMN IF NOT EXISTS account_id uuid;
  END IF;
END $$;
ALTER TABLE public.gmail_connections ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.square_connections ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.job_line_items ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.job_photos ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS account_id uuid;

-- -------------------------------------------------------------------
-- Backfill account_id (default account used only for backfill)
-- -------------------------------------------------------------------
DO $$
DECLARE
  default_account_id uuid;
BEGIN
  SELECT id INTO default_account_id
  FROM public.accounts
  ORDER BY created_at
  LIMIT 1;

  IF default_account_id IS NULL THEN
    RAISE EXCEPTION 'No accounts exist; cannot backfill account_id safely.';
  END IF;

  -- Core spine tables
  UPDATE public.jobs j
  SET account_id = c.account_id
  FROM public.clients c
  WHERE j.account_id IS NULL
    AND j.client_id = c.id;

  UPDATE public.jobs
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.estimates e
  SET account_id = c.account_id
  FROM public.clients c
  WHERE e.account_id IS NULL
    AND e.client_id = c.id;

  UPDATE public.estimates
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.invoices i
  SET account_id = j.account_id
  FROM public.jobs j
  WHERE i.account_id IS NULL
    AND i.job_id = j.id;

  UPDATE public.invoices
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.properties p
  SET account_id = c.account_id
  FROM public.clients c
  WHERE p.account_id IS NULL
    AND p.client_id = c.id;

  UPDATE public.properties
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.leads l
  SET account_id = c.account_id
  FROM public.clients c
  WHERE l.account_id IS NULL
    AND l.converted_to_client_id = c.id;

  UPDATE public.leads
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  -- Line items / photos / payments
  UPDATE public.job_line_items jli
  SET account_id = j.account_id
  FROM public.jobs j
  WHERE jli.account_id IS NULL
    AND jli.job_id = j.id;

  UPDATE public.job_photos jp
  SET account_id = j.account_id
  FROM public.jobs j
  WHERE jp.account_id IS NULL
    AND jp.job_id = j.id;

  UPDATE public.job_notes jn
  SET account_id = j.account_id
  FROM public.jobs j
  WHERE jn.account_id IS NULL
    AND jn.job_id = j.id;

  UPDATE public.payments p
  SET account_id = j.account_id
  FROM public.jobs j
  WHERE p.account_id IS NULL
    AND p.job_id = j.id;

  UPDATE public.invoice_line_items ili
  SET account_id = i.account_id
  FROM public.invoices i
  WHERE ili.account_id IS NULL
    AND ili.invoice_id = i.id;

  UPDATE public.invoice_payments ip
  SET account_id = i.account_id
  FROM public.invoices i
  WHERE ip.account_id IS NULL
    AND ip.invoice_id = i.id;

  UPDATE public.invoice_line_items
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.invoice_payments
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.payments
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.job_line_items
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.job_photos
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.job_notes
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  -- Email and integrations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    UPDATE public.emails_raw
    SET account_id = default_account_id
    WHERE account_id IS NULL;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
      UPDATE public.email_insights ei
      SET account_id = er.account_id
      FROM public.emails_raw er
      WHERE ei.account_id IS NULL
        AND ei.email_id = er.id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
      UPDATE public.email_lead_details eld
      SET account_id = er.account_id
      FROM public.emails_raw er
      WHERE eld.account_id IS NULL
        AND eld.email_id = er.id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
      UPDATE public.alerts a
      SET account_id = er.account_id
      FROM public.emails_raw er
      WHERE a.account_id IS NULL
        AND a.email_id = er.id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
      UPDATE public.billing_events be
      SET account_id = er.account_id
      FROM public.emails_raw er
      WHERE be.account_id IS NULL
        AND be.email_id = er.id;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    UPDATE public.email_insights
    SET account_id = default_account_id
    WHERE account_id IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    UPDATE public.email_lead_details
    SET account_id = default_account_id
    WHERE account_id IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    UPDATE public.alerts
    SET account_id = default_account_id
    WHERE account_id IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    UPDATE public.billing_events
    SET account_id = default_account_id
    WHERE account_id IS NULL;
  END IF;

  UPDATE public.gmail_connections
  SET account_id = default_account_id
  WHERE account_id IS NULL;

  UPDATE public.square_connections
  SET account_id = default_account_id
  WHERE account_id IS NULL;
END $$;

-- -------------------------------------------------------------------
-- Enforce account_id NOT NULL where required
-- -------------------------------------------------------------------
ALTER TABLE public.jobs ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.estimates ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.properties ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.job_notes ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.job_line_items ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.job_photos ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.invoice_line_items ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.invoice_payments ALTER COLUMN account_id SET NOT NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.emails_raw ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    ALTER TABLE public.email_insights ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    ALTER TABLE public.email_lead_details ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    ALTER TABLE public.alerts ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    ALTER TABLE public.billing_events ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;
ALTER TABLE public.gmail_connections ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.square_connections ALTER COLUMN account_id SET NOT NULL;

-- -------------------------------------------------------------------
-- Add account_id foreign keys (idempotent)
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_account_id_fkey') THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_account_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_account_id_fkey') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_account_id_fkey') THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_account_id_fkey') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_notes_account_id_fkey') THEN
    ALTER TABLE public.job_notes
      ADD CONSTRAINT job_notes_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_line_items_account_id_fkey') THEN
    ALTER TABLE public.job_line_items
      ADD CONSTRAINT job_line_items_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_photos_account_id_fkey') THEN
    ALTER TABLE public.job_photos
      ADD CONSTRAINT job_photos_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_account_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_line_items_account_id_fkey') THEN
    ALTER TABLE public.invoice_line_items
      ADD CONSTRAINT invoice_line_items_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payments_account_id_fkey') THEN
    ALTER TABLE public.invoice_payments
      ADD CONSTRAINT invoice_payments_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'emails_raw_account_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.emails_raw
      ADD CONSTRAINT emails_raw_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_insights_account_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    ALTER TABLE public.email_insights
      ADD CONSTRAINT email_insights_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_lead_details_account_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    ALTER TABLE public.email_lead_details
      ADD CONSTRAINT email_lead_details_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alerts_account_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    ALTER TABLE public.alerts
      ADD CONSTRAINT alerts_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_events_account_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    ALTER TABLE public.billing_events
      ADD CONSTRAINT billing_events_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gmail_connections_account_id_fkey') THEN
    ALTER TABLE public.gmail_connections
      ADD CONSTRAINT gmail_connections_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'square_connections_account_id_fkey') THEN
    ALTER TABLE public.square_connections
      ADD CONSTRAINT square_connections_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- Revoke anon access to tenant tables
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    REVOKE ALL ON TABLE public.alerts FROM anon;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    REVOKE ALL ON TABLE public.billing_events FROM anon;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    REVOKE ALL ON TABLE public.emails_raw FROM anon;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    REVOKE ALL ON TABLE public.email_insights FROM anon;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    REVOKE ALL ON TABLE public.email_lead_details FROM anon;
  END IF;
END $$;
REVOKE ALL ON TABLE public.gmail_connections FROM anon;
REVOKE ALL ON TABLE public.square_connections FROM anon;
REVOKE ALL ON TABLE public.clients FROM anon;
REVOKE ALL ON TABLE public.customers FROM anon;
REVOKE ALL ON TABLE public.properties FROM anon;
REVOKE ALL ON TABLE public.jobs FROM anon;
REVOKE ALL ON TABLE public.job_line_items FROM anon;
REVOKE ALL ON TABLE public.job_photos FROM anon;
REVOKE ALL ON TABLE public.job_notes FROM anon;
REVOKE ALL ON TABLE public.estimates FROM anon;
REVOKE ALL ON TABLE public.invoices FROM anon;
REVOKE ALL ON TABLE public.invoice_line_items FROM anon;
REVOKE ALL ON TABLE public.invoice_payments FROM anon;
REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.leads FROM anon;
REVOKE ALL ON TABLE public.visits FROM anon;

-- -------------------------------------------------------------------
-- Ensure RLS enabled on tenant tables
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.emails_raw ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    ALTER TABLE public.email_insights ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    ALTER TABLE public.email_lead_details ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.square_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- Drop existing policies on MVP spine tenant tables
-- -------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'alerts',
        'billing_events',
        'emails_raw',
        'email_insights',
        'email_lead_details',
        'gmail_connections',
        'square_connections',
        'clients',
        'customers',
        'properties',
        'jobs',
        'job_line_items',
        'job_photos',
        'job_notes',
        'estimates',
        'invoices',
        'invoice_line_items',
        'invoice_payments',
        'payments',
        'leads',
        'visits'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- -------------------------------------------------------------------
-- Replace with hardened policies
-- -------------------------------------------------------------------
-- Clients
CREATE POLICY mvp_admin_manage_clients
  ON public.clients FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_admin_read_clients
  ON public.clients FOR SELECT
  USING (public.user_is_account_admin(account_id));

-- Customers
CREATE POLICY mvp_admin_manage_customers
  ON public.customers FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_self
  ON public.customers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY mvp_customer_update_self
  ON public.customers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Properties
CREATE POLICY mvp_admin_manage_properties
  ON public.properties FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_admin_read_properties
  ON public.properties FOR SELECT
  USING (public.user_is_account_admin(account_id));

-- Jobs
CREATE POLICY mvp_admin_manage_jobs
  ON public.jobs FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_tech_read_assigned_jobs
  ON public.jobs FOR SELECT
  USING (assigned_tech_id = auth.uid() AND public.user_is_account_tech(account_id));

CREATE POLICY mvp_customer_read_own_jobs
  ON public.jobs FOR SELECT
  USING (
    customer_id = public.current_customer_id()
    AND account_id = public.current_customer_account_id()
  );

-- Job line items
CREATE POLICY mvp_admin_manage_job_line_items
  ON public.job_line_items FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_tech_read_job_line_items
  ON public.job_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_line_items.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_line_items.account_id
    )
  );

CREATE POLICY mvp_customer_read_job_line_items
  ON public.job_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_line_items.job_id
        AND j.customer_id = public.current_customer_id()
        AND j.account_id = job_line_items.account_id
    )
  );

-- Job photos
CREATE POLICY mvp_admin_manage_job_photos
  ON public.job_photos FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_tech_read_job_photos
  ON public.job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_photos.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_photos.account_id
    )
  );

CREATE POLICY mvp_customer_read_job_photos
  ON public.job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_photos.job_id
        AND j.customer_id = public.current_customer_id()
        AND j.account_id = job_photos.account_id
    )
  );

-- Job notes
CREATE POLICY mvp_admin_manage_job_notes
  ON public.job_notes FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_tech_read_job_notes
  ON public.job_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_notes.account_id
    )
  );

CREATE POLICY mvp_tech_insert_job_notes
  ON public.job_notes FOR INSERT
  WITH CHECK (
    technician_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_notes.job_id
        AND j.assigned_tech_id = auth.uid()
        AND j.account_id = job_notes.account_id
    )
  );

-- Estimates
CREATE POLICY mvp_admin_manage_estimates
  ON public.estimates FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_own_estimates
  ON public.estimates FOR SELECT
  USING (
    customer_id = public.current_customer_id()
    AND account_id = public.current_customer_account_id()
  );

-- Invoices
CREATE POLICY mvp_admin_manage_invoices
  ON public.invoices FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_own_invoices
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = invoices.job_id
        AND j.customer_id = public.current_customer_id()
        AND j.account_id = invoices.account_id
    )
  );

-- Invoice line items
CREATE POLICY mvp_admin_manage_invoice_line_items
  ON public.invoice_line_items FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_invoice_line_items
  ON public.invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.jobs j ON j.id = i.job_id
      WHERE i.id = invoice_line_items.invoice_id
        AND j.customer_id = public.current_customer_id()
        AND i.account_id = invoice_line_items.account_id
    )
  );

-- Invoice payments
CREATE POLICY mvp_admin_manage_invoice_payments
  ON public.invoice_payments FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_invoice_payments
  ON public.invoice_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.jobs j ON j.id = i.job_id
      WHERE i.id = invoice_payments.invoice_id
        AND j.customer_id = public.current_customer_id()
        AND i.account_id = invoice_payments.account_id
    )
  );

-- Payments
CREATE POLICY mvp_admin_manage_payments
  ON public.payments FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_customer_read_payments
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = payments.job_id
        AND j.customer_id = public.current_customer_id()
        AND j.account_id = payments.account_id
    )
  );

-- Leads
CREATE POLICY mvp_admin_manage_leads
  ON public.leads FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_admin_read_leads
  ON public.leads FOR SELECT
  USING (public.user_is_account_admin(account_id));

-- Visits
CREATE POLICY mvp_admin_manage_visits
  ON public.visits FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_tech_read_assigned_visits
  ON public.visits FOR SELECT
  USING (technician_id = auth.uid() AND public.user_is_account_tech(account_id));

-- Email + integrations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    EXECUTE 'CREATE POLICY mvp_admin_manage_emails_raw
      ON public.emails_raw FOR ALL
      USING (public.user_is_account_admin(account_id))
      WITH CHECK (public.user_is_account_admin(account_id))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_insights') THEN
    EXECUTE 'CREATE POLICY mvp_admin_manage_email_insights
      ON public.email_insights FOR ALL
      USING (public.user_is_account_admin(account_id))
      WITH CHECK (public.user_is_account_admin(account_id))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_lead_details') THEN
    EXECUTE 'CREATE POLICY mvp_admin_manage_email_lead_details
      ON public.email_lead_details FOR ALL
      USING (public.user_is_account_admin(account_id))
      WITH CHECK (public.user_is_account_admin(account_id))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
    EXECUTE 'CREATE POLICY mvp_admin_manage_alerts
      ON public.alerts FOR ALL
      USING (public.user_is_account_admin(account_id))
      WITH CHECK (public.user_is_account_admin(account_id))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_events') THEN
    EXECUTE 'CREATE POLICY mvp_admin_manage_billing_events
      ON public.billing_events FOR ALL
      USING (public.user_is_account_admin(account_id))
      WITH CHECK (public.user_is_account_admin(account_id))';
  END IF;
END $$;

CREATE POLICY mvp_admin_manage_gmail_connections
  ON public.gmail_connections FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE POLICY mvp_admin_manage_square_connections
  ON public.square_connections FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));
