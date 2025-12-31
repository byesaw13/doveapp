-- Reconcile unexpected tables found in schema_baseline.sql but missing from migrations.
-- This migration is defensive: CREATE TABLE IF NOT EXISTS, enable RLS, and add minimal policies.

-- -------------------------------------------------------------------
-- activity_log
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_user_id uuid,
  actor_role text,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  meta_json jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_activity_log_select ON public.activity_log;
CREATE POLICY recon_activity_log_select
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.account_memberships am
      WHERE am.user_id = auth.uid()
        AND am.is_active = true
        AND am.account_id = (
          SELECT account_memberships.account_id
          FROM public.account_memberships
          WHERE account_memberships.user_id = activity_log.actor_user_id
          LIMIT 1
        )
    )
  );

CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON public.activity_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log (created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log (entity_type, entity_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_actor_user_id_fkey') THEN
    ALTER TABLE public.activity_log
      ADD CONSTRAINT activity_log_actor_user_id_fkey
      FOREIGN KEY (actor_user_id) REFERENCES public.users(id);
  END IF;
END $$;

-- -------------------------------------------------------------------
-- alerts
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_id uuid,
  type text NOT NULL,
  priority text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  account_id uuid NOT NULL,
  CONSTRAINT alerts_pkey PRIMARY KEY (id)
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_alerts_select ON public.alerts;
DROP POLICY IF EXISTS recon_alerts_admin_manage ON public.alerts;
CREATE POLICY recon_alerts_select
  ON public.alerts FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_alerts_admin_manage
  ON public.alerts FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_alerts_account_id ON public.alerts (account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_email_id ON public.alerts (email_id);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.alerts (priority);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts (type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alerts_account_id_fkey') THEN
    ALTER TABLE public.alerts
      ADD CONSTRAINT alerts_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alerts_email_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.alerts
      ADD CONSTRAINT alerts_email_id_fkey
      FOREIGN KEY (email_id) REFERENCES public.emails_raw(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- billing_events
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_id uuid,
  direction text,
  amount numeric(10,2),
  currency text,
  invoice_number text,
  vendor_or_client_name text,
  due_date date,
  paid_date date,
  status text,
  created_at timestamptz DEFAULT now(),
  account_id uuid NOT NULL,
  CONSTRAINT billing_events_pkey PRIMARY KEY (id)
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_billing_events_select ON public.billing_events;
DROP POLICY IF EXISTS recon_billing_events_admin_manage ON public.billing_events;
CREATE POLICY recon_billing_events_select
  ON public.billing_events FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_billing_events_admin_manage
  ON public.billing_events FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_billing_events_account_id ON public.billing_events (account_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_email_id ON public.billing_events (email_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_due_date ON public.billing_events (due_date);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_events_account_id_fkey') THEN
    ALTER TABLE public.billing_events
      ADD CONSTRAINT billing_events_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_events_email_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.billing_events
      ADD CONSTRAINT billing_events_email_id_fkey
      FOREIGN KEY (email_id) REFERENCES public.emails_raw(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- email_insights
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_insights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_id uuid,
  category text NOT NULL,
  priority text NOT NULL,
  is_action_required boolean DEFAULT false NOT NULL,
  action_type text,
  summary text,
  notes text,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  account_id uuid NOT NULL,
  CONSTRAINT email_insights_pkey PRIMARY KEY (id)
);

ALTER TABLE public.email_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_email_insights_select ON public.email_insights;
DROP POLICY IF EXISTS recon_email_insights_admin_manage ON public.email_insights;
CREATE POLICY recon_email_insights_select
  ON public.email_insights FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_email_insights_admin_manage
  ON public.email_insights FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_email_insights_account_id ON public.email_insights (account_id);
CREATE INDEX IF NOT EXISTS idx_email_insights_email_id ON public.email_insights (email_id);
CREATE INDEX IF NOT EXISTS idx_email_insights_category ON public.email_insights (category);
CREATE INDEX IF NOT EXISTS idx_email_insights_is_action_required ON public.email_insights (is_action_required);
CREATE INDEX IF NOT EXISTS idx_email_insights_priority ON public.email_insights (priority);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_insights_account_id_fkey') THEN
    ALTER TABLE public.email_insights
      ADD CONSTRAINT email_insights_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_insights_email_id_fkey') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emails_raw') THEN
    ALTER TABLE public.email_insights
      ADD CONSTRAINT email_insights_email_id_fkey
      FOREIGN KEY (email_id) REFERENCES public.emails_raw(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- email_lead_details
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_lead_details (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_id uuid,
  contact_name text,
  contact_email text,
  contact_phone text,
  address_line text,
  city text,
  state text,
  postal_code text,
  service_type text,
  urgency text DEFAULT 'normal' NOT NULL,
  preferred_dates jsonb,
  budget_hint text,
  source_channel text,
  has_photos boolean DEFAULT false,
  parsed_confidence numeric(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid NOT NULL,
  CONSTRAINT email_lead_details_pkey PRIMARY KEY (id),
  CONSTRAINT email_lead_details_parsed_confidence_check CHECK (parsed_confidence >= 0.0 AND parsed_confidence <= 1.0),
  CONSTRAINT email_lead_details_urgency_check CHECK (urgency = ANY (ARRAY['low','normal','high','emergency']))
);

ALTER TABLE public.email_lead_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_email_lead_details_select ON public.email_lead_details;
DROP POLICY IF EXISTS recon_email_lead_details_admin_manage ON public.email_lead_details;
CREATE POLICY recon_email_lead_details_select
  ON public.email_lead_details FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_email_lead_details_admin_manage
  ON public.email_lead_details FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_email_lead_details_account_id ON public.email_lead_details (account_id);
CREATE INDEX IF NOT EXISTS idx_email_lead_details_email_id ON public.email_lead_details (email_id);
CREATE INDEX IF NOT EXISTS idx_email_lead_details_service_type ON public.email_lead_details (service_type);
CREATE INDEX IF NOT EXISTS idx_email_lead_details_urgency ON public.email_lead_details (urgency);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_lead_details_account_id_fkey') THEN
    ALTER TABLE public.email_lead_details
      ADD CONSTRAINT email_lead_details_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- emails_raw
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emails_raw (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  gmail_message_id text NOT NULL,
  thread_id text,
  subject text,
  from_address text,
  to_addresses text,
  cc_addresses text,
  received_at timestamptz,
  snippet text,
  body_text text,
  body_html text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  is_starred boolean DEFAULT false NOT NULL,
  account_id uuid NOT NULL,
  CONSTRAINT emails_raw_pkey PRIMARY KEY (id),
  CONSTRAINT emails_raw_gmail_message_id_key UNIQUE (gmail_message_id)
);

ALTER TABLE public.emails_raw ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_emails_raw_select ON public.emails_raw;
DROP POLICY IF EXISTS recon_emails_raw_admin_manage ON public.emails_raw;
CREATE POLICY recon_emails_raw_select
  ON public.emails_raw FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_emails_raw_admin_manage
  ON public.emails_raw FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_emails_raw_account_id ON public.emails_raw (account_id);
CREATE INDEX IF NOT EXISTS idx_emails_raw_gmail_message_id ON public.emails_raw (gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_emails_raw_is_read ON public.emails_raw (is_read);
CREATE INDEX IF NOT EXISTS idx_emails_raw_is_starred ON public.emails_raw (is_starred);
CREATE INDEX IF NOT EXISTS idx_emails_raw_received_at ON public.emails_raw (received_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'emails_raw_account_id_fkey') THEN
    ALTER TABLE public.emails_raw
      ADD CONSTRAINT emails_raw_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- estimate_templates
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estimate_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  service_type text NOT NULL,
  default_line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  default_terms text,
  default_payment_terms text,
  default_valid_days integer DEFAULT 30 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT estimate_templates_pkey PRIMARY KEY (id)
);

ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_estimate_templates_select ON public.estimate_templates;
DROP POLICY IF EXISTS recon_estimate_templates_service_role_manage ON public.estimate_templates;
CREATE POLICY recon_estimate_templates_select
  ON public.estimate_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY recon_estimate_templates_service_role_manage
  ON public.estimate_templates FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_estimate_templates_service_type ON public.estimate_templates (service_type);

-- -------------------------------------------------------------------
-- estimates
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estimates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  estimate_number text NOT NULL,
  lead_id uuid,
  client_id uuid,
  property_id uuid,
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft' NOT NULL,
  line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric(10,2) DEFAULT 0 NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0 NOT NULL,
  valid_until date NOT NULL,
  terms_and_conditions text,
  payment_terms text,
  notes text,
  sent_date timestamptz,
  viewed_date timestamptz,
  accepted_date timestamptz,
  declined_date timestamptz,
  decline_reason text,
  converted_to_job_id uuid,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approval_info jsonb,
  decline_info jsonb,
  sent_history jsonb DEFAULT '[]'::jsonb,
  account_id uuid NOT NULL,
  customer_id uuid,
  CONSTRAINT estimates_pkey PRIMARY KEY (id),
  CONSTRAINT estimates_estimate_number_key UNIQUE (estimate_number),
  CONSTRAINT estimates_status_check CHECK (status = ANY (ARRAY['draft','pending','sent','approved','declined','expired','revised']))
);

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_estimates_select ON public.estimates;
DROP POLICY IF EXISTS recon_estimates_admin_manage ON public.estimates;
CREATE POLICY recon_estimates_select
  ON public.estimates FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_estimates_admin_manage
  ON public.estimates FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_estimates_account_id ON public.estimates (account_id);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON public.estimates (client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_lead_id ON public.estimates (lead_id);
CREATE INDEX IF NOT EXISTS idx_estimates_property_id ON public.estimates (property_id);
CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON public.estimates (estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates (status);
CREATE INDEX IF NOT EXISTS idx_estimates_valid_until ON public.estimates (valid_until);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_account_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_client_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_lead_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_property_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_converted_to_job_id_fkey') THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_converted_to_job_id_fkey
      FOREIGN KEY (converted_to_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------------
-- job_photos
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  photo_type text NOT NULL,
  caption text,
  taken_at timestamptz,
  uploaded_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid NOT NULL,
  CONSTRAINT job_photos_pkey PRIMARY KEY (id),
  CONSTRAINT job_photos_photo_type_check CHECK (photo_type = ANY (ARRAY['before','during','after','other']))
);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_job_photos_select ON public.job_photos;
DROP POLICY IF EXISTS recon_job_photos_admin_manage ON public.job_photos;
CREATE POLICY recon_job_photos_select
  ON public.job_photos FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM public.account_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY recon_job_photos_admin_manage
  ON public.job_photos FOR ALL
  USING (public.user_is_account_admin(account_id))
  WITH CHECK (public.user_is_account_admin(account_id));

CREATE INDEX IF NOT EXISTS idx_job_photos_account_id ON public.job_photos (account_id);
CREATE INDEX IF NOT EXISTS job_photos_created_at_idx ON public.job_photos (created_at);
CREATE INDEX IF NOT EXISTS job_photos_job_id_idx ON public.job_photos (job_id);
CREATE INDEX IF NOT EXISTS job_photos_photo_type_idx ON public.job_photos (photo_type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_photos_account_id_fkey') THEN
    ALTER TABLE public.job_photos
      ADD CONSTRAINT job_photos_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_photos_job_id_fkey') THEN
    ALTER TABLE public.job_photos
      ADD CONSTRAINT job_photos_job_id_fkey
      FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;
END $$;
