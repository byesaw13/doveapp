-- NOTE: This file is a schema snapshot for reference and drift detection only.
-- It reflects the current database state after all migrations have been applied.
-- This file is NOT a migration and MUST NOT be edited to introduce schema changes.
-- All forward schema changes must be made via new migration files.
-- If drift is detected, fix migrations first, then regenerate this snapshot.
-- See docs/roadmap/SYSTEM_ROADMAP.md and TABLE_OWNERSHIP.md for authority rules.
-- Schema Baseline for DoveApp
-- Regenerated: 2025-01-22
-- This file represents the complete schema state after applying all migrations.
-- It should match the production database schema exactly.




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA public;



COMMENT ON SCHEMA public IS 'standard public schema';



CREATE FUNCTION public.auto_create_invoice_reminders() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only create reminders for sent invoices
  IF NEW.status = 'sent' AND NEW.due_date IS NOT NULL THEN
    PERFORM create_invoice_reminders(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.calculate_break_duration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.calculate_next_maintenance_date(last_date date, interval_days integer) RETURNS date
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF last_date IS NULL OR interval_days IS NULL OR interval_days <= 0 THEN
    RETURN NULL;
  END IF;

  RETURN last_date + INTERVAL '1 day' * interval_days;
END;
$$;



CREATE FUNCTION public.calculate_time_entry_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  break_minutes INTEGER := 0;
  total_minutes INTEGER;
  billable_minutes INTEGER;
BEGIN
  -- Calculate total break time in minutes
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO break_minutes
  FROM time_breaks
  WHERE time_entry_id = NEW.id AND end_time IS NOT NULL;

  -- Calculate total time in minutes
  IF NEW.end_time IS NOT NULL THEN
    total_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    billable_minutes := GREATEST(total_minutes - break_minutes, 0);

    NEW.total_hours := ROUND(total_minutes / 60.0, 2);
    NEW.billable_hours := ROUND(billable_minutes / 60.0, 2);
    NEW.total_amount := ROUND(NEW.billable_hours * COALESCE(NEW.hourly_rate, 0), 2);
  END IF;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.create_invoice_reminders(target_invoice_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  invoice_record RECORD;
  reminder_count INTEGER := 0;
  due_date_approaching TIMESTAMP;
  overdue_date TIMESTAMP;
  final_notice_date TIMESTAMP;
BEGIN
  -- Get invoice details
  SELECT * INTO invoice_record
  FROM invoices
  WHERE id = target_invoice_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate reminder dates
  due_date_approaching := invoice_record.due_date - INTERVAL '3 days';
  overdue_date := invoice_record.due_date + INTERVAL '1 day';
  final_notice_date := invoice_record.due_date + INTERVAL '7 days';

  -- Create reminder for due date approaching (3 days before)
  IF due_date_approaching > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'due_date_approaching',
      due_date_approaching,
      'Invoice Due Soon - ' || invoice_record.invoice_number,
      'Your invoice ' || invoice_record.invoice_number || ' is due in 3 days. Please arrange payment to avoid late fees.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  -- Create overdue reminder (1 day after due date)
  IF overdue_date > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'overdue',
      overdue_date,
      'OVERDUE: Invoice ' || invoice_record.invoice_number,
      'Your invoice ' || invoice_record.invoice_number || ' is now overdue. Please remit payment immediately.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  -- Create final notice (7 days after due date)
  IF final_notice_date > NOW() THEN
    INSERT INTO invoice_reminders (
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email
    ) VALUES (
      target_invoice_id,
      'final_notice',
      final_notice_date,
      'FINAL NOTICE: Invoice ' || invoice_record.invoice_number,
      'This is your final notice for invoice ' || invoice_record.invoice_number || '. Immediate payment is required.',
      (SELECT email FROM clients WHERE id = invoice_record.client_id)
    );
    reminder_count := reminder_count + 1;
  END IF;

  RETURN reminder_count;
END;
$$;



CREATE FUNCTION public.current_customer_account_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT account_id
  FROM public.customers
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;



CREATE FUNCTION public.current_customer_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT id
  FROM public.customers
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;



CREATE FUNCTION public.execute_job_workflow(job_uuid uuid, workflow_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  job_record RECORD;
  workflow_record RECORD;
  actions_result JSONB := '[]';
  action_result JSONB;
BEGIN
  -- Get job and workflow details
  SELECT * INTO job_record FROM jobs WHERE id = job_uuid;
  SELECT * INTO workflow_record FROM job_workflows WHERE id = workflow_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Job or workflow not found');
  END IF;

  -- Execute each action in the workflow
  FOR action_result IN SELECT * FROM jsonb_array_elements(workflow_record.actions)
  LOOP
    -- Here you would implement different action types
    -- For now, we'll just log what would happen
    actions_result := actions_result || jsonb_build_object(
      'action_type', action_result->>'type',
      'executed_at', NOW(),
      'status', 'simulated'
    );
  END LOOP;

  -- Record the execution
  INSERT INTO job_workflow_executions (
    job_id,
    workflow_id,
    trigger_status,
    actions_executed,
    success
  ) VALUES (
    job_uuid,
    workflow_uuid,
    job_record.status,
    actions_result,
    true
  );

  RETURN actions_result;
END;
$$;



CREATE FUNCTION public.generate_estimate_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM estimates
  WHERE estimate_number LIKE 'EST-%';
  
  new_number := 'EST-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;



CREATE FUNCTION public.generate_invoice_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-%';

  new_number := 'INV-' || LPAD(next_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$;



CREATE FUNCTION public.generate_job_number() RETURNS text
    LANGUAGE plpgsql
    AS $_$
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
$_$;



CREATE FUNCTION public.get_available_team_members(start_datetime timestamp with time zone, end_datetime timestamp with time zone) RETURNS TABLE(user_id uuid, full_name text, availability_conflicts integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name' as full_name,
    COUNT(*)::INTEGER as availability_conflicts
  FROM auth.users u
  LEFT JOIN team_schedules ts ON ts.user_id = u.id
    AND ts.scheduled_date = start_datetime::DATE
    AND (
      (ts.start_time, ts.end_time) OVERLAPS (start_datetime::TIME, end_datetime::TIME)
      OR ts.is_all_day = true
    )
  WHERE u.raw_user_meta_data->>'role' IN ('TECH', 'ADMIN', 'OWNER')
    AND u.is_active = true
  GROUP BY u.id, u.raw_user_meta_data->>'full_name'
  HAVING COUNT(ts.id) = 0; -- No conflicting schedules
END;
$$;



CREATE FUNCTION public.get_current_technician_rate(tech_name text, check_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_rate DECIMAL(8,2);
BEGIN
  SELECT hourly_rate
  INTO current_rate
  FROM technician_rates
  WHERE technician_name = tech_name
    AND effective_date <= check_date
    AND (end_date IS NULL OR end_date >= check_date)
  ORDER BY effective_date DESC
  LIMIT 1;

  RETURN COALESCE(current_rate, 0);
END;
$$;



CREATE FUNCTION public.get_customer_communication_summary(customer_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  result JSONB;
  total_communications INTEGER;
  last_contact TIMESTAMPTZ;
  avg_response_time INTERVAL;
  sentiment_distribution JSONB;
  communication_types JSONB;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_communications
  FROM customer_communications
  WHERE customer_id = customer_uuid;

  -- Get last contact
  SELECT MAX(occurred_at) INTO last_contact
  FROM customer_communications
  WHERE customer_id = customer_uuid;

  -- Get sentiment distribution
  SELECT jsonb_object_agg(sentiment, count) INTO sentiment_distribution
  FROM (
    SELECT sentiment, COUNT(*) as count
    FROM customer_communications
    WHERE customer_id = customer_uuid AND sentiment IS NOT NULL
    GROUP BY sentiment
  ) s;

  -- Get communication types distribution
  SELECT jsonb_object_agg(communication_type, count) INTO communication_types
  FROM (
    SELECT communication_type, COUNT(*) as count
    FROM customer_communications
    WHERE customer_id = customer_uuid
    GROUP BY communication_type
  ) t;

  result := jsonb_build_object(
    'total_communications', total_communications,
    'last_contact', last_contact,
    'sentiment_distribution', COALESCE(sentiment_distribution, '{}'::jsonb),
    'communication_types', COALESCE(communication_types, '{}'::jsonb),
    'pending_followups', (
      SELECT COUNT(*) FROM customer_communications
      WHERE customer_id = customer_uuid
      AND requires_followup = true
      AND (followup_date IS NULL OR followup_date > NOW())
    ),
    'overdue_followups', (
      SELECT COUNT(*) FROM customer_communications
      WHERE customer_id = customer_uuid
      AND requires_followup = true
      AND followup_date < NOW()
    )
  );

  RETURN result;
END;
$$;



CREATE FUNCTION public.get_team_member_availability(user_uuid uuid, check_date date DEFAULT CURRENT_DATE) RETURNS TABLE(day_of_week integer, start_time time without time zone, end_time time without time zone, is_available boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_day INTEGER := EXTRACT(DOW FROM check_date);
BEGIN
  RETURN QUERY
  SELECT
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    ta.is_available
  FROM team_availability ta
  WHERE ta.user_id = user_uuid
    AND ta.day_of_week = target_day
    AND ta.is_available = true
  ORDER BY ta.start_time;
END;
$$;



CREATE FUNCTION public.get_tool_recognition_stats(days_back integer DEFAULT 30) RETURNS TABLE(total_analyses bigint, successful_analyses bigint, average_matches numeric, high_confidence_rate numeric, verification_rate numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE processing_status = 'completed') as successful_analyses,
    ROUND(AVG(match_count), 2) as average_matches,
    ROUND(
      (COUNT(*) FILTER (WHERE high_confidence_matches > 0)::numeric /
       NULLIF(COUNT(*) FILTER (WHERE total_matches > 0), 0)) * 100, 2
    ) as high_confidence_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE verified_matches > 0)::numeric /
       NULLIF(COUNT(*) FILTER (WHERE total_matches > 0), 0)) * 100, 2
    ) as verification_rate
  FROM (
    SELECT
      trr.id,
      COUNT(trm.id) as total_matches,
      COUNT(CASE WHEN trm.confidence_score >= 0.8 THEN 1 END) as high_confidence_matches,
      COUNT(CASE WHEN trm.verified_by_user = true THEN 1 END) as verified_matches
    FROM tool_recognition_results trr
    LEFT JOIN tool_recognition_matches trm ON trr.id = trm.recognition_result_id
    WHERE trr.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY trr.id
  ) stats;
END;
$$;



CREATE FUNCTION public.increment_template_usage(template_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE job_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$;



CREATE FUNCTION public.process_pending_reminders() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  reminder_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process reminders that are due
  FOR reminder_record IN
    SELECT * FROM invoice_reminders
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
  LOOP
    -- Here you would integrate with your email service
    -- For now, we'll just mark as sent
    UPDATE invoice_reminders
    SET
      status = 'sent',
      sent_at = NOW(),
      sent_via = 'email'
    WHERE id = reminder_record.id;

    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$$;



CREATE FUNCTION public.process_tool_recognition_matches() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- This function would be called after AI analysis to create matches
  -- For now, it's a placeholder for the matching logic
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.record_material_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This function can be called manually to record purchases, returns, or adjustments
    -- It will be used by application code to maintain audit trail
    RETURN NEW;
END;
$$;



CREATE FUNCTION public.schedule_next_maintenance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only schedule next maintenance if this one was completed and tool has maintenance interval
  IF NEW.status = 'completed' AND NEW.next_maintenance_date IS NOT NULL THEN
    -- Update the material's next maintenance date
    UPDATE materials
    SET last_maintenance_date = NEW.completed_date,
        next_maintenance_date = NEW.next_maintenance_date
    WHERE id = NEW.material_id;

    -- Optionally create the next maintenance record
    INSERT INTO tool_maintenance (
      material_id,
      maintenance_type,
      scheduled_date,
      status
    )
    SELECT
      NEW.material_id,
      NEW.maintenance_type,
      NEW.next_maintenance_date,
      'scheduled'
    WHERE NEW.next_maintenance_date IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.set_estimate_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    NEW.estimate_number := generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.set_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.tech_update_job_status(p_job_id uuid, p_new_status text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_account_id uuid;
  v_current_status text;
BEGIN
  -- Ensure caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller is an active TECH on the same account AND is assigned to the job
  SELECT j.account_id, j.status
    INTO v_account_id, v_current_status
  FROM jobs j
  WHERE j.id = p_job_id
    AND j.assigned_tech_id = auth.uid();

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Job not found or not assigned to you';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM account_memberships am
    WHERE am.user_id = auth.uid()
      AND am.account_id = v_account_id
      AND am.role = 'TECH'
      AND am.is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate new status value
  IF p_new_status NOT IN ('scheduled', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- Enforce forward-only transitions
  IF v_current_status = 'scheduled' AND p_new_status NOT IN ('in_progress', 'completed') THEN
    RAISE EXCEPTION 'Invalid transition';
  ELSIF v_current_status = 'in_progress' AND p_new_status <> 'completed' THEN
    RAISE EXCEPTION 'Invalid transition';
  ELSIF v_current_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot change status once completed';
  END IF;

  -- Update only the status
  UPDATE jobs
  SET status = p_new_status
  WHERE id = p_job_id
    AND assigned_tech_id = auth.uid();

  -- Optional: write a note for audit trail
  INSERT INTO job_notes (job_id, technician_id, note, account_id)
  VALUES (p_job_id, auth.uid(), 'Status changed to: ' || p_new_status, v_account_id);

END;
$$;



CREATE FUNCTION public.trigger_job_workflows() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  workflow_record RECORD;
  result JSONB;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Find and execute workflows for this status
  FOR workflow_record IN
    SELECT * FROM job_workflows
    WHERE trigger_status = NEW.status
    AND is_active = true
  LOOP
    -- Execute the workflow
    SELECT execute_job_workflow(NEW.id, workflow_record.id) INTO result;
  END LOOP;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_ai_estimate_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_business_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_customer_communications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_email_templates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_employee_profile_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_estimates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_invoice_reminders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_invoices_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_job_payment_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;



CREATE FUNCTION public.update_job_payment_status_on_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;



CREATE FUNCTION public.update_job_templates_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_job_workflows_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_leads_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_material_stock_on_job_usage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Deduct stock when material is used on a job
    UPDATE materials
    SET current_stock = current_stock - NEW.quantity_used
    WHERE id = NEW.material_id;

    -- Record the transaction
    INSERT INTO material_transactions (
        material_id,
        transaction_type,
        quantity,
        previous_stock,
        new_stock,
        unit_cost,
        total_cost,
        reference_id,
        reference_type,
        notes
    )
    SELECT
        NEW.material_id,
        'usage',
        -NEW.quantity_used,
        m.current_stock + NEW.quantity_used, -- previous stock before deduction
        m.current_stock, -- new stock after deduction
        NEW.unit_cost,
        NEW.total_cost,
        NEW.job_id,
        'job',
        'Used on job'
    FROM materials m
    WHERE m.id = NEW.material_id;

    RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_security_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_team_assignments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_team_schedules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_time_entries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_tool_status_on_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update material tool_status based on assignment
  IF NEW.status = 'active' THEN
    UPDATE materials
    SET tool_status = 'assigned',
        assigned_to = NEW.assigned_to,
        assigned_to_name = NEW.assigned_to_name,
        assigned_date = NEW.assigned_date,
        expected_return_date = NEW.expected_return_date
    WHERE id = NEW.material_id;
  END IF;

  -- If assignment is returned, update material status
  IF NEW.status = 'returned' THEN
    UPDATE materials
    SET tool_status = 'available',
        assigned_to = NULL,
        assigned_to_name = NULL,
        assigned_date = NULL,
        expected_return_date = NULL
    WHERE id = NEW.material_id;
  END IF;

  RETURN NEW;
END;
$$;



CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;



CREATE FUNCTION public.user_is_account_admin(account_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_memberships
    WHERE account_id = account_uuid
    AND user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
    AND is_active = true
  );
END;
$$;



CREATE FUNCTION public.user_is_account_member(account_uuid uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships
    WHERE account_id = account_uuid
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;



CREATE FUNCTION public.user_is_account_staff(account_uuid uuid) RETURNS boolean
    LANGUAGE sql STABLE
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



CREATE FUNCTION public.user_is_account_tech(account_uuid uuid) RETURNS boolean
    LANGUAGE sql STABLE
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


SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.account_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    permissions jsonb,
    CONSTRAINT account_memberships_role_check CHECK ((role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])))
);



COMMENT ON TABLE public.account_memberships IS 'Links users to accounts with specific roles (OWNER, ADMIN, TECH). Default account membership should only exist if no other account membership is present.';



COMMENT ON COLUMN public.account_memberships.permissions IS 'Custom permissions array for ADMIN users. OWNER role gets all permissions by default.';



CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subdomain text,
    custom_domain text,
    logo_url text,
    brand_primary_color text DEFAULT '#0066cc'::text,
    brand_secondary_color text DEFAULT '#f3f4f6'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



COMMENT ON TABLE public.accounts IS 'Multi-tenant accounts. Each business is an account with multiple users.';



CREATE TABLE public.activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    actor_role text,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    meta_json jsonb,
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.ai_estimate_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    default_profit_margin numeric(5,2) DEFAULT 25.00 NOT NULL,
    markup_on_materials numeric(5,2) DEFAULT 15.00 NOT NULL,
    markup_on_subcontractors numeric(5,2) DEFAULT 10.00 NOT NULL,
    hourly_labor_rate numeric(8,2) DEFAULT 25.00 NOT NULL,
    billable_hourly_rate numeric(8,2) DEFAULT 75.00 NOT NULL,
    overtime_multiplier numeric(3,2) DEFAULT 1.50 NOT NULL,
    material_markup_percentage numeric(5,2) DEFAULT 20.00 NOT NULL,
    equipment_rental_rate numeric(8,2) DEFAULT 50.00 NOT NULL,
    fuel_surcharge_percentage numeric(5,2) DEFAULT 5.00 NOT NULL,
    overhead_percentage numeric(5,2) DEFAULT 15.00 NOT NULL,
    insurance_percentage numeric(5,2) DEFAULT 3.00 NOT NULL,
    administrative_fee numeric(8,2) DEFAULT 50.00 NOT NULL,
    permit_fees numeric(8,2) DEFAULT 100.00 NOT NULL,
    disposal_fees numeric(8,2) DEFAULT 25.00 NOT NULL,
    default_tax_rate numeric(5,2) DEFAULT 8.50 NOT NULL,
    taxable_labor boolean DEFAULT true NOT NULL,
    taxable_materials boolean DEFAULT true NOT NULL,
    minimum_job_size numeric(10,2) DEFAULT 500.00 NOT NULL,
    round_to_nearest numeric(8,2) DEFAULT 5.00 NOT NULL,
    include_contingency boolean DEFAULT true NOT NULL,
    contingency_percentage numeric(5,2) DEFAULT 10.00 NOT NULL,
    service_rates jsonb DEFAULT '{"hvac": {"hourly_rate": 95.00, "diagnostic_fee": 125.00, "refrigerant_cost_per_lb": 15.00}, "general": {"hourly_rate": 75.00, "minimum_charge": 150.00}, "painting": {"primer_included": true, "labor_rate_per_sqft": 2.50, "material_cost_per_sqft": 1.25}, "plumbing": {"trip_fee": 75.00, "hourly_rate": 85.00, "emergency_multiplier": 2.00}, "electrical": {"permit_fee": 150.00, "hourly_rate": 90.00, "inspection_fee": 100.00}}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ai_behavior jsonb DEFAULT '{"risk_strategy": "balanced", "confidence_threshold": 0.8, "image_analysis_detail": "medium", "historical_data_weight": 0.5, "auto_approve_confidence": 0.9, "require_human_review_above_value": 5000}'::jsonb NOT NULL,
    CONSTRAINT ai_estimate_settings_administrative_fee_check CHECK ((administrative_fee >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_billable_hourly_rate_check CHECK ((billable_hourly_rate > (0)::numeric)),
    CONSTRAINT ai_estimate_settings_contingency_percentage_check CHECK ((contingency_percentage >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_default_profit_margin_check CHECK (((default_profit_margin >= (0)::numeric) AND (default_profit_margin <= (100)::numeric))),
    CONSTRAINT ai_estimate_settings_default_tax_rate_check CHECK (((default_tax_rate >= (0)::numeric) AND (default_tax_rate <= (100)::numeric))),
    CONSTRAINT ai_estimate_settings_disposal_fees_check CHECK ((disposal_fees >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_equipment_rental_rate_check CHECK ((equipment_rental_rate >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_fuel_surcharge_percentage_check CHECK ((fuel_surcharge_percentage >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_hourly_labor_rate_check CHECK ((hourly_labor_rate > (0)::numeric)),
    CONSTRAINT ai_estimate_settings_insurance_percentage_check CHECK ((insurance_percentage >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_markup_on_materials_check CHECK ((markup_on_materials >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_markup_on_subcontractors_check CHECK ((markup_on_subcontractors >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_material_markup_percentage_check CHECK ((material_markup_percentage >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_minimum_job_size_check CHECK ((minimum_job_size >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_overhead_percentage_check CHECK (((overhead_percentage >= (0)::numeric) AND (overhead_percentage <= (100)::numeric))),
    CONSTRAINT ai_estimate_settings_overtime_multiplier_check CHECK ((overtime_multiplier >= (1)::numeric)),
    CONSTRAINT ai_estimate_settings_permit_fees_check CHECK ((permit_fees >= (0)::numeric)),
    CONSTRAINT ai_estimate_settings_round_to_nearest_check CHECK ((round_to_nearest > (0)::numeric))
);



COMMENT ON TABLE public.ai_estimate_settings IS 'Configurable settings for AI-powered estimate generation including profit margins, labor rates, and business rules';



CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_id uuid,
    type text NOT NULL,
    priority text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    account_id uuid NOT NULL
);



CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    resource_type character varying(50) NOT NULL,
    resource_id uuid,
    description text,
    ip_address inet,
    user_agent text,
    metadata jsonb,
    severity character varying(20) DEFAULT 'info'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_severity_check CHECK (((severity)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying, 'critical'::character varying])::text[])))
);



COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail of security-relevant actions and system events';



CREATE TABLE public.automation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    automation_id uuid,
    status text,
    message text,
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.automations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    related_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    run_at timestamp with time zone NOT NULL,
    last_attempt timestamp with time zone,
    attempts integer DEFAULT 0,
    payload jsonb,
    result jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT automations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT automations_type_check CHECK ((type = ANY (ARRAY['estimate_followup'::text, 'invoice_followup'::text, 'job_closeout'::text, 'review_request'::text, 'lead_response'::text])))
);



CREATE TABLE public.billing_events (
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
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.business_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text DEFAULT 'Your Company Name'::text NOT NULL,
    company_address text,
    company_city text,
    company_state text,
    company_zip text,
    company_phone text,
    company_email text,
    company_website text,
    logo_url text,
    default_estimate_validity_days integer DEFAULT 30,
    default_tax_rate numeric(5,2) DEFAULT 0.00,
    default_payment_terms text DEFAULT 'Payment due within 30 days'::text,
    default_estimate_terms text DEFAULT 'This estimate is valid for 30 days. All work is guaranteed for 90 days. Final pricing may vary based on site conditions.'::text,
    default_invoice_terms text DEFAULT 'Thank you for your business. Please remit payment within 30 days.'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ai_automation jsonb DEFAULT '{"job_closeout": true, "lead_response": true, "review_requests": true, "invoice_followups": true, "estimate_followups": true}'::jsonb NOT NULL
);



CREATE TABLE public.channel_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    label text,
    config jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.client_activities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    title text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    related_id uuid,
    related_type character varying(50),
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    completed_at timestamp with time zone
);



COMMENT ON TABLE public.client_activities IS 'Timeline of all client interactions and events';



COMMENT ON COLUMN public.client_activities.activity_type IS 'Type of activity: email, call, meeting, note, job_created, job_completed, estimate_sent, estimate_accepted, payment_received, etc.';



COMMENT ON COLUMN public.client_activities.metadata IS 'Additional data specific to activity type (e.g., email subject, job amount, etc.)';



COMMENT ON COLUMN public.client_activities.related_id IS 'ID of related record (job, estimate, payment, etc.)';



COMMENT ON COLUMN public.client_activities.related_type IS 'Type of related record (job, estimate, payment, etc.)';



COMMENT ON COLUMN public.client_activities.due_date IS 'Due date for task-type activities';



COMMENT ON COLUMN public.client_activities.completed_at IS 'Completion timestamp for task-type activities';



CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    square_customer_id text,
    first_name text NOT NULL,
    last_name text NOT NULL,
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
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



COMMENT ON TABLE public.clients IS 'Legacy client records. Used by jobs, estimates, and invoices. Consider migrating to customers table.';



CREATE TABLE public.contact_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT contact_requests_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT contact_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])))
);



CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    title text,
    status text DEFAULT 'open'::text,
    primary_channel text,
    lead_score text,
    last_message_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



COMMENT ON TABLE public.conversations IS 'Customer conversations with status for inbox organization';



COMMENT ON COLUMN public.conversations.status IS 'Conversation status for inbox management: open (active) or closed (done)';



CREATE TABLE public.customer_communications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    communication_type character varying(50) NOT NULL,
    direction character varying(20),
    subject text,
    content text,
    summary text,
    contact_person character varying(255),
    contact_method character varying(100),
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_minutes integer,
    priority character varying(20) DEFAULT 'normal'::character varying,
    status character varying(20) DEFAULT 'completed'::character varying,
    requires_followup boolean DEFAULT false,
    followup_date timestamp with time zone,
    followup_notes text,
    tags text[],
    sentiment character varying(20),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    job_id uuid,
    invoice_id uuid,
    CONSTRAINT customer_communications_direction_check CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying, 'internal'::character varying])::text[]))),
    CONSTRAINT customer_communications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT customer_communications_sentiment_check CHECK (((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::text[]))),
    CONSTRAINT customer_communications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT customer_communications_type_check CHECK (((communication_type)::text = ANY ((ARRAY['call'::character varying, 'email'::character varying, 'note'::character varying, 'meeting'::character varying, 'sms'::character varying, 'in_person'::character varying, 'other'::character varying])::text[])))
);



CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text,
    phone text,
    secondary_phone text,
    address text,
    source text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL,
    user_id uuid,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    first_name text,
    last_name text,
    status text DEFAULT 'inactive'::text,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT customers_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'active'::text, 'inactive'::text])))
);



COMMENT ON TABLE public.customers IS 'Multi-portal customer records with account scoping. Used by messaging system and customer portal invitations.';



CREATE TABLE public.email_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_id uuid,
    category text NOT NULL,
    priority text NOT NULL,
    is_action_required boolean DEFAULT false NOT NULL,
    action_type text,
    summary text,
    notes text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.email_lead_details (
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
    urgency text DEFAULT 'normal'::text NOT NULL,
    preferred_dates jsonb,
    budget_hint text,
    source_channel text,
    has_photos boolean DEFAULT false,
    parsed_confidence numeric(3,2) DEFAULT 0.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL,
    CONSTRAINT email_lead_details_parsed_confidence_check CHECK (((parsed_confidence >= 0.0) AND (parsed_confidence <= 1.0))),
    CONSTRAINT email_lead_details_urgency_check CHECK ((urgency = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'emergency'::text])))
);



CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    subject_template text NOT NULL,
    body_template text NOT NULL,
    is_default boolean DEFAULT false,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT email_templates_type_check CHECK (((type)::text = ANY ((ARRAY['invoice'::character varying, 'estimate'::character varying, 'general'::character varying])::text[])))
);



CREATE TABLE public.emails_raw (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gmail_message_id text NOT NULL,
    thread_id text,
    subject text,
    from_address text,
    to_addresses text,
    cc_addresses text,
    received_at timestamp with time zone,
    snippet text,
    body_text text,
    body_html text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    is_starred boolean DEFAULT false NOT NULL,
    account_id uuid NOT NULL
);



CREATE TABLE public.employee_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name text,
    last_name text,
    display_name text,
    avatar_url text,
    personal_email text,
    work_email text,
    primary_phone text,
    secondary_phone text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    country text DEFAULT 'US'::text,
    employee_id text,
    hire_date date,
    employment_status text DEFAULT 'active'::text,
    job_title text,
    department text,
    manager_id uuid,
    hourly_rate numeric(10,2),
    overtime_rate numeric(10,2),
    salary numeric(12,2),
    pay_frequency text DEFAULT 'hourly'::text,
    work_schedule text,
    skills text[],
    certifications text[],
    licenses text[],
    notes text,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT employee_profiles_employment_status_check CHECK ((employment_status = ANY (ARRAY['active'::text, 'inactive'::text, 'terminated'::text, 'on_leave'::text]))),
    CONSTRAINT employee_profiles_pay_frequency_check CHECK ((pay_frequency = ANY (ARRAY['hourly'::text, 'salary'::text, 'commission'::text])))
);



COMMENT ON TABLE public.employee_profiles IS 'Comprehensive employee profile information including contact details, employment info, and compensation';



CREATE TABLE public.estimate_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    service_type text NOT NULL,
    default_line_items jsonb DEFAULT '[]'::jsonb NOT NULL,
    default_terms text,
    default_payment_terms text,
    default_valid_days integer DEFAULT 30 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.estimates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    estimate_number text NOT NULL,
    lead_id uuid,
    client_id uuid,
    property_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
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
    sent_date timestamp with time zone,
    viewed_date timestamp with time zone,
    accepted_date timestamp with time zone,
    declined_date timestamp with time zone,
    decline_reason text,
    converted_to_job_id uuid,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approval_info jsonb,
    decline_info jsonb,
    sent_history jsonb DEFAULT '[]'::jsonb,
    account_id uuid NOT NULL,
    customer_id uuid,
    CONSTRAINT estimates_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'sent'::text, 'approved'::text, 'declined'::text, 'expired'::text, 'revised'::text])))
);



COMMENT ON TABLE public.estimates IS 'Estimates and quotes for potential jobs';



CREATE TABLE public.gmail_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_address text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



COMMENT ON TABLE public.gmail_connections IS 'Stores Gmail OAuth credentials for email sync. Used by Gmail worker to fetch emails and route to unified inbox.';



COMMENT ON COLUMN public.gmail_connections.access_token IS 'Short-lived OAuth access token (expires in ~1 hour). Refresh using refresh_token when expired.';



COMMENT ON COLUMN public.gmail_connections.refresh_token IS 'Long-lived token used to obtain new access tokens without user re-authentication.';



COMMENT ON COLUMN public.gmail_connections.token_expires_at IS 'Timestamp when access_token expires. Worker should refresh before this time.';



CREATE TABLE public.invoice_line_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    service_id integer,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    tier text,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    line_total numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    account_id uuid NOT NULL
);



CREATE TABLE public.invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL,
    reference text,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    account_id uuid NOT NULL
);



CREATE TABLE public.invoice_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    reminder_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    subject text,
    message text,
    sent_via character varying(50),
    recipient_email character varying(255),
    recipient_phone character varying(50),
    error_message text,
    created_by uuid,
    CONSTRAINT invoice_reminders_reminder_type_check CHECK (((reminder_type)::text = ANY ((ARRAY['due_date_approaching'::character varying, 'overdue'::character varying, 'final_notice'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT invoice_reminders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);



CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    estimate_id uuid,
    client_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    invoice_number text,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    balance_due numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    client_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    account_id uuid NOT NULL,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'partial'::text, 'paid'::text, 'void'::text])))
);



CREATE TABLE public.job_checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    item_text text NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.job_line_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    item_type text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    service_id integer,
    tier text,
    line_total numeric(10,2),
    account_id uuid NOT NULL,
    CONSTRAINT job_line_items_item_type_check CHECK ((item_type = ANY (ARRAY['labor'::text, 'material'::text])))
);



CREATE TABLE public.job_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    material_id uuid,
    quantity_used numeric(10,2) NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    notes text,
    used_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.job_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    technician_id uuid,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.job_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    filename text NOT NULL,
    original_filename text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    photo_type text NOT NULL,
    caption text,
    taken_at timestamp with time zone,
    uploaded_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL,
    CONSTRAINT job_photos_photo_type_check CHECK ((photo_type = ANY (ARRAY['before'::text, 'during'::text, 'after'::text, 'other'::text])))
);



CREATE TABLE public.job_template_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid,
    job_id uuid,
    used_by uuid,
    used_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.job_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    estimated_duration_hours numeric(6,2),
    estimated_cost numeric(10,2),
    default_priority character varying(20) DEFAULT 'medium'::character varying,
    template_data jsonb NOT NULL,
    is_public boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT job_templates_default_priority_check CHECK (((default_priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))
);



CREATE VIEW public.job_time_summary AS
SELECT
    NULL::uuid AS job_id,
    NULL::uuid AS account_id,
    NULL::text AS job_number,
    NULL::text AS title,
    NULL::text AS client_name,
    NULL::bigint AS time_entries,
    NULL::numeric AS total_hours,
    NULL::numeric AS billable_hours,
    NULL::numeric AS total_billed,
    NULL::numeric AS avg_hourly_rate,
    NULL::timestamp with time zone AS first_clock_in,
    NULL::timestamp with time zone AS last_clock_out;



CREATE TABLE public.job_tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    material_id uuid,
    assigned_date timestamp with time zone DEFAULT now() NOT NULL,
    returned_date timestamp with time zone,
    assigned_by uuid,
    assigned_by_name text,
    notes text,
    status text DEFAULT 'assigned'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT job_tools_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'returned'::text, 'lost'::text, 'damaged'::text])))
);



CREATE TABLE public.job_workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    trigger_status character varying(50) NOT NULL,
    executed_at timestamp with time zone DEFAULT now(),
    actions_executed jsonb,
    success boolean DEFAULT true,
    error_message text,
    created_by uuid
);



CREATE TABLE public.job_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trigger_status character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    actions jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT job_workflows_trigger_status_check CHECK (((trigger_status)::text = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);



CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    job_number text NOT NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL,
    service_date date,
    scheduled_time time without time zone,
    subtotal numeric(10,2) DEFAULT 0,
    tax numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    property_id uuid,
    estimate_id uuid,
    scheduled_for timestamp with time zone,
    internal_notes text,
    client_notes text,
    ready_for_invoice boolean DEFAULT false NOT NULL,
    account_id uuid NOT NULL,
    customer_id uuid,
    assigned_tech_id uuid,
    CONSTRAINT jobs_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text]))),
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'quote'::text, 'scheduled'::text, 'in_progress'::text, 'completed'::text, 'invoiced'::text, 'cancelled'::text])))
);



CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    activity_type text NOT NULL,
    description text NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lead_activities_activity_type_check CHECK ((activity_type = ANY (ARRAY['call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'status_change'::text])))
);



CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    company_name text,
    email text NOT NULL,
    phone text NOT NULL,
    alternate_phone text,
    source text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    service_type text,
    service_description text,
    estimated_value numeric(10,2),
    address text,
    city text,
    state text,
    zip_code text,
    assigned_to text,
    follow_up_date timestamp with time zone,
    last_contact_date timestamp with time zone,
    converted_to_client_id uuid,
    lost_reason text,
    notes text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL,
    CONSTRAINT leads_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT leads_source_check CHECK ((source = ANY (ARRAY['website'::text, 'referral'::text, 'social_media'::text, 'email'::text, 'phone'::text, 'walk_in'::text, 'advertisement'::text, 'other'::text]))),
    CONSTRAINT leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal_sent'::text, 'negotiating'::text, 'converted'::text, 'lost'::text, 'unqualified'::text])))
);



COMMENT ON TABLE public.leads IS 'Lead tracking and management';



CREATE TABLE public.material_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    material_id uuid,
    transaction_type text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    previous_stock numeric(10,2) NOT NULL,
    new_stock numeric(10,2) NOT NULL,
    unit_cost numeric(10,2),
    total_cost numeric(10,2),
    reference_id uuid,
    reference_type text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT material_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['purchase'::text, 'usage'::text, 'adjustment'::text, 'return'::text])))
);



CREATE TABLE public.materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'General'::text NOT NULL,
    unit_cost numeric(10,2) DEFAULT 0 NOT NULL,
    current_stock numeric(10,2) DEFAULT 0 NOT NULL,
    min_stock numeric(10,2) DEFAULT 0 NOT NULL,
    reorder_point numeric(10,2) DEFAULT 0 NOT NULL,
    unit_of_measure text DEFAULT 'each'::text NOT NULL,
    supplier_name text,
    supplier_contact text,
    location text,
    sku text,
    barcode text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_tool boolean DEFAULT false NOT NULL,
    serial_number text,
    tool_condition text DEFAULT 'good'::text,
    assigned_to uuid,
    assigned_to_name text,
    assigned_date timestamp with time zone,
    expected_return_date timestamp with time zone,
    tool_status text DEFAULT 'available'::text NOT NULL,
    purchase_date date,
    warranty_expires date,
    maintenance_interval_days integer,
    last_maintenance_date date,
    next_maintenance_date date,
    CONSTRAINT materials_tool_condition_check CHECK ((tool_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'needs_repair'::text, 'retired'::text]))),
    CONSTRAINT materials_tool_status_check CHECK ((tool_status = ANY (ARRAY['available'::text, 'assigned'::text, 'maintenance'::text, 'lost'::text, 'retired'::text])))
);



CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    channel text NOT NULL,
    direction text NOT NULL,
    external_id text,
    raw_payload jsonb,
    message_text text,
    attachments jsonb DEFAULT '[]'::jsonb,
    ai_summary text,
    ai_category text,
    ai_urgency text,
    ai_next_action text,
    ai_extracted jsonb,
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text,
    payment_date date NOT NULL,
    notes text,
    square_payment_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.profile_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_profile_id uuid,
    change_type text NOT NULL,
    requested_changes jsonb NOT NULL,
    current_values jsonb,
    status text DEFAULT 'pending'::text,
    requested_by uuid NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    CONSTRAINT profile_change_requests_change_type_check CHECK ((change_type = ANY (ARRAY['update'::text, 'create'::text]))),
    CONSTRAINT profile_change_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text])))
);



COMMENT ON TABLE public.profile_change_requests IS 'Approval workflow for employee profile changes requiring admin review';



CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip_code text,
    property_type text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.security_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    password_policy jsonb DEFAULT '{"min_length": 8, "require_numbers": true, "require_symbols": false, "require_lowercase": true, "require_uppercase": true, "password_expiry_days": 90}'::jsonb NOT NULL,
    session_policy jsonb DEFAULT '{"require_2fa": false, "remember_me_days": 30, "max_concurrent_sessions": 5, "session_timeout_minutes": 480}'::jsonb NOT NULL,
    audit_policy jsonb DEFAULT '{"retention_days": 365, "export_audit_logs": true, "enable_audit_logging": true, "log_sensitive_actions": true}'::jsonb NOT NULL,
    compliance_policy jsonb DEFAULT '{"gdpr_compliance": false, "require_consent": true, "hipaa_compliance": false, "data_retention_years": 7, "enable_data_anonymization": false}'::jsonb NOT NULL,
    encryption_policy jsonb DEFAULT '{"backup_encryption": true, "key_rotation_days": 90, "encryption_algorithm": "AES-256", "encrypt_sensitive_data": true}'::jsonb NOT NULL,
    access_policy jsonb DEFAULT '{"allowed_ips": [], "allow_api_access": true, "ip_whitelist_enabled": false, "rate_limiting_enabled": true, "max_requests_per_minute": 100}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);



COMMENT ON TABLE public.security_settings IS 'Comprehensive security, compliance, and audit configurations for the application';



CREATE TABLE public.square_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid NOT NULL
);



CREATE TABLE public.team_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    scheduled_date date,
    scheduled_start_time time without time zone,
    scheduled_end_time time without time zone,
    estimated_duration_hours numeric(4,2),
    actual_duration_hours numeric(4,2),
    status character varying(50) DEFAULT 'assigned'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT team_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['assigned'::character varying, 'accepted'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);



CREATE TABLE public.team_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT team_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);



CREATE TABLE public.team_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    scheduled_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    schedule_type character varying(50) NOT NULL,
    is_all_day boolean DEFAULT false,
    location character varying(255),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT team_schedules_schedule_type_check CHECK (((schedule_type)::text = ANY ((ARRAY['work'::character varying, 'meeting'::character varying, 'training'::character varying, 'vacation'::character varying, 'sick'::character varying, 'personal'::character varying, 'other'::character varying])::text[])))
);



CREATE TABLE public.technician_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    technician_id uuid,
    technician_name text NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    accuracy numeric(6,2),
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    activity_type text DEFAULT 'tracking'::text,
    job_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid,
    CONSTRAINT technician_locations_activity_type_check CHECK ((activity_type = ANY (ARRAY['tracking'::text, 'clock_in'::text, 'clock_out'::text, 'job_start'::text, 'job_end'::text])))
);



CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    technician_id uuid,
    technician_name text NOT NULL,
    job_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    total_hours numeric(6,2),
    billable_hours numeric(6,2),
    hourly_rate numeric(8,2),
    total_amount numeric(10,2),
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    location_start jsonb,
    location_end jsonb,
    device_info jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    account_id uuid,
    assignment_id uuid,
    user_id uuid,
    clock_in timestamp with time zone,
    clock_out timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS ((EXTRACT(epoch FROM (clock_out - clock_in)) / (60)::numeric)) STORED,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    CONSTRAINT time_entries_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'approved'::text, 'rejected'::text, 'paid'::text])))
);



CREATE VIEW public.technician_productivity AS
 SELECT account_id,
    technician_name,
    date_trunc('month'::text, start_time) AS month,
    count(*) AS total_entries,
    sum(total_hours) AS total_hours,
    sum(billable_hours) AS billable_hours,
    avg(hourly_rate) AS avg_hourly_rate,
    sum(total_amount) AS total_amount,
    avg(total_hours) AS avg_hours_per_entry,
    count(
        CASE
            WHEN (status = 'approved'::text) THEN 1
            ELSE NULL::integer
        END) AS approved_entries,
    count(
        CASE
            WHEN (status = 'rejected'::text) THEN 1
            ELSE NULL::integer
        END) AS rejected_entries
   FROM public.time_entries
  WHERE (end_time IS NOT NULL)
  GROUP BY account_id, technician_name, (date_trunc('month'::text, start_time))
  ORDER BY (date_trunc('month'::text, start_time)) DESC, technician_name;



CREATE TABLE public.technician_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    technician_id uuid,
    technician_name text NOT NULL,
    hourly_rate numeric(8,2) NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid
);



CREATE TABLE public.time_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    time_entry_id uuid,
    approver_id uuid,
    approver_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_hours numeric(6,2),
    approved_amount numeric(10,2),
    approval_notes text,
    rejection_reason text,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid,
    CONSTRAINT time_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'needs_revision'::text])))
);



CREATE TABLE public.time_breaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    time_entry_id uuid,
    break_type text DEFAULT 'lunch'::text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    account_id uuid,
    CONSTRAINT time_breaks_break_type_check CHECK ((break_type = ANY (ARRAY['lunch'::text, 'break'::text, 'meeting'::text, 'other'::text])))
);



CREATE VIEW public.time_tracking_summary AS
 SELECT te.id,
    te.account_id,
    te.technician_name,
    te.job_id,
    j.job_number,
    j.title AS job_title,
    COALESCE(c.company_name, ((c.first_name || ' '::text) || c.last_name)) AS client_name,
    te.start_time,
    te.end_time,
    te.total_hours,
    te.billable_hours,
    te.hourly_rate,
    te.total_amount,
    te.status,
    te.notes,
    COALESCE(break_summary.total_breaks, (0)::bigint) AS total_breaks,
    COALESCE(break_summary.total_break_minutes, (0)::bigint) AS total_break_minutes,
    ta.status AS approval_status,
    ta.approver_name,
    ta.approved_at
   FROM ((((public.time_entries te
     LEFT JOIN public.jobs j ON (((te.job_id = j.id) AND ((j.account_id = te.account_id) OR (j.account_id IS NULL)))))
     LEFT JOIN public.clients c ON ((j.client_id = c.id)))
     LEFT JOIN ( SELECT time_breaks.account_id,
            time_breaks.time_entry_id,
            count(*) AS total_breaks,
            sum(time_breaks.duration_minutes) AS total_break_minutes
           FROM public.time_breaks
          WHERE (time_breaks.end_time IS NOT NULL)
          GROUP BY time_breaks.account_id, time_breaks.time_entry_id) break_summary ON (((te.id = break_summary.time_entry_id) AND ((break_summary.account_id = te.account_id) OR (break_summary.account_id IS NULL)))))
     LEFT JOIN public.time_approvals ta ON (((te.id = ta.time_entry_id) AND ((ta.account_id = te.account_id) OR (ta.account_id IS NULL)))))
  ORDER BY te.start_time DESC;



CREATE TABLE public.tool_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    material_id uuid,
    assigned_to uuid,
    assigned_to_name text NOT NULL,
    assigned_by uuid,
    assigned_by_name text,
    assigned_date timestamp with time zone DEFAULT now() NOT NULL,
    expected_return_date timestamp with time zone,
    actual_return_date timestamp with time zone,
    job_id uuid,
    notes text,
    condition_at_assignment text,
    condition_at_return text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tool_assignments_condition_at_assignment_check CHECK ((condition_at_assignment = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text]))),
    CONSTRAINT tool_assignments_condition_at_return_check CHECK ((condition_at_return = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'needs_repair'::text, 'damaged'::text]))),
    CONSTRAINT tool_assignments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'returned'::text, 'overdue'::text, 'lost'::text])))
);



CREATE VIEW public.tool_availability AS
 SELECT id,
    name,
    category,
    serial_number,
    tool_condition,
    tool_status,
    assigned_to_name,
    assigned_date,
    expected_return_date,
        CASE
            WHEN (tool_status = 'available'::text) THEN true
            WHEN ((tool_status = 'assigned'::text) AND (expected_return_date < now())) THEN false
            ELSE false
        END AS is_available,
        CASE
            WHEN (next_maintenance_date IS NOT NULL) THEN (next_maintenance_date - CURRENT_DATE)
            ELSE NULL::integer
        END AS days_until_maintenance
   FROM public.materials m
  WHERE ((is_tool = true) AND (is_active = true));



CREATE TABLE public.tool_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    material_id uuid,
    image_url text NOT NULL,
    image_filename text NOT NULL,
    image_hash text,
    image_metadata jsonb,
    is_primary boolean DEFAULT false NOT NULL,
    uploaded_by uuid,
    uploaded_by_name text,
    created_at timestamp with time zone DEFAULT now()
);



CREATE TABLE public.tool_inventory_counts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location text NOT NULL,
    counted_by uuid,
    counted_by_name text,
    photo_url text,
    recognition_result_id uuid,
    counted_tools jsonb,
    manual_overrides jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    CONSTRAINT tool_inventory_counts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'verified'::text, 'applied'::text])))
);



CREATE TABLE public.tool_maintenance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    material_id uuid,
    maintenance_type text NOT NULL,
    scheduled_date date NOT NULL,
    completed_date date,
    technician_name text,
    cost numeric(10,2),
    notes text,
    parts_used text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    next_maintenance_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tool_maintenance_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'overdue'::text])))
);



CREATE TABLE public.tool_recognition_matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recognition_result_id uuid,
    material_id uuid,
    confidence_score numeric(3,2) NOT NULL,
    bounding_box jsonb,
    match_reason text,
    verified_by_user boolean DEFAULT false NOT NULL,
    verified_at timestamp with time zone,
    verified_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tool_recognition_matches_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))
);



CREATE TABLE public.tool_recognition_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    image_hash text,
    analysis_provider text DEFAULT 'google_vision'::text NOT NULL,
    analysis_version text,
    raw_response jsonb,
    detected_objects jsonb,
    recognized_tools jsonb,
    processing_status text DEFAULT 'pending'::text NOT NULL,
    processing_error text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tool_recognition_results_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);



CREATE VIEW public.tool_recognition_summary AS
 SELECT trr.id AS recognition_id,
    trr.image_url,
    trr.processing_status,
    trr.processed_at,
    count(trm.id) AS total_matches,
    count(
        CASE
            WHEN (trm.confidence_score >= 0.8) THEN 1
            ELSE NULL::integer
        END) AS high_confidence_matches,
    count(
        CASE
            WHEN (trm.verified_by_user = true) THEN 1
            ELSE NULL::integer
        END) AS verified_matches,
    json_agg(json_build_object('material_id', trm.material_id, 'material_name', m.name, 'confidence_score', trm.confidence_score, 'verified', trm.verified_by_user)) FILTER (WHERE (trm.id IS NOT NULL)) AS matched_tools
   FROM ((public.tool_recognition_results trr
     LEFT JOIN public.tool_recognition_matches trm ON ((trr.id = trm.recognition_result_id)))
     LEFT JOIN public.materials m ON ((trm.material_id = m.id)))
  GROUP BY trr.id, trr.image_url, trr.processing_status, trr.processed_at;



CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    must_change_password boolean DEFAULT false,
    password_changed_at timestamp with time zone
);



COMMENT ON COLUMN public.users.must_change_password IS 'Flag to force password change on next login';



COMMENT ON COLUMN public.users.password_changed_at IS 'Timestamp of last password change';



CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    job_id uuid NOT NULL,
    technician_id uuid,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    status text DEFAULT 'scheduled'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT visits_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);



ALTER TABLE ONLY public.account_memberships
    ADD CONSTRAINT account_memberships_account_id_user_id_key UNIQUE (account_id, user_id);



ALTER TABLE ONLY public.account_memberships
    ADD CONSTRAINT account_memberships_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_subdomain_key UNIQUE (subdomain);



ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.ai_estimate_settings
    ADD CONSTRAINT ai_estimate_settings_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.automation_history
    ADD CONSTRAINT automation_history_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.business_settings
    ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.channel_accounts
    ADD CONSTRAINT channel_accounts_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.client_activities
    ADD CONSTRAINT client_activities_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_square_customer_id_key UNIQUE (square_customer_id);



ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.email_insights
    ADD CONSTRAINT email_insights_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.email_lead_details
    ADD CONSTRAINT email_lead_details_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.emails_raw
    ADD CONSTRAINT emails_raw_gmail_message_id_key UNIQUE (gmail_message_id);



ALTER TABLE ONLY public.emails_raw
    ADD CONSTRAINT emails_raw_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_employee_id_key UNIQUE (employee_id);



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.estimate_templates
    ADD CONSTRAINT estimate_templates_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_estimate_number_key UNIQUE (estimate_number);



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.gmail_connections
    ADD CONSTRAINT gmail_connections_email_address_key UNIQUE (email_address);



ALTER TABLE ONLY public.gmail_connections
    ADD CONSTRAINT gmail_connections_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.invoice_reminders
    ADD CONSTRAINT invoice_reminders_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_checklist_items
    ADD CONSTRAINT job_checklist_items_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_line_items
    ADD CONSTRAINT job_line_items_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_materials
    ADD CONSTRAINT job_materials_job_id_material_id_key UNIQUE (job_id, material_id);



ALTER TABLE ONLY public.job_materials
    ADD CONSTRAINT job_materials_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_notes
    ADD CONSTRAINT job_notes_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT job_photos_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_template_usage
    ADD CONSTRAINT job_template_usage_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_tools
    ADD CONSTRAINT job_tools_job_id_material_id_key UNIQUE (job_id, material_id);



ALTER TABLE ONLY public.job_tools
    ADD CONSTRAINT job_tools_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_workflow_executions
    ADD CONSTRAINT job_workflow_executions_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.job_workflows
    ADD CONSTRAINT job_workflows_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_job_number_key UNIQUE (job_number);



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.material_transactions
    ADD CONSTRAINT material_transactions_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_sku_key UNIQUE (sku);



ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.profile_change_requests
    ADD CONSTRAINT profile_change_requests_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.security_settings
    ADD CONSTRAINT security_settings_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.square_connections
    ADD CONSTRAINT square_connections_merchant_id_key UNIQUE (merchant_id);



ALTER TABLE ONLY public.square_connections
    ADD CONSTRAINT square_connections_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.team_assignments
    ADD CONSTRAINT team_assignments_job_id_user_id_key UNIQUE (job_id, user_id);



ALTER TABLE ONLY public.team_assignments
    ADD CONSTRAINT team_assignments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.team_availability
    ADD CONSTRAINT team_availability_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.team_availability
    ADD CONSTRAINT team_availability_user_id_day_of_week_start_time_end_time_key UNIQUE (user_id, day_of_week, start_time, end_time);



ALTER TABLE ONLY public.team_schedules
    ADD CONSTRAINT team_schedules_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.technician_locations
    ADD CONSTRAINT technician_locations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.technician_rates
    ADD CONSTRAINT technician_rates_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.technician_rates
    ADD CONSTRAINT technician_rates_technician_id_effective_date_key UNIQUE (technician_id, effective_date);



ALTER TABLE ONLY public.time_approvals
    ADD CONSTRAINT time_approvals_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.time_breaks
    ADD CONSTRAINT time_breaks_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_assignments
    ADD CONSTRAINT tool_assignments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_images
    ADD CONSTRAINT tool_images_image_hash_key UNIQUE (image_hash);



ALTER TABLE ONLY public.tool_images
    ADD CONSTRAINT tool_images_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_inventory_counts
    ADD CONSTRAINT tool_inventory_counts_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_maintenance
    ADD CONSTRAINT tool_maintenance_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_recognition_matches
    ADD CONSTRAINT tool_recognition_matches_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.tool_recognition_results
    ADD CONSTRAINT tool_recognition_results_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);



ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);



CREATE INDEX client_activities_client_id_idx ON public.client_activities USING btree (client_id);



CREATE INDEX client_activities_created_at_idx ON public.client_activities USING btree (created_at DESC);



CREATE INDEX client_activities_type_idx ON public.client_activities USING btree (activity_type);



CREATE INDEX clients_account_id_idx ON public.clients USING btree (account_id);



CREATE INDEX clients_email_idx ON public.clients USING btree (email) WHERE (email IS NOT NULL);



CREATE INDEX clients_name_idx ON public.clients USING btree (first_name, last_name);



CREATE INDEX clients_phone_idx ON public.clients USING btree (phone) WHERE (phone IS NOT NULL);



CREATE INDEX clients_search_idx ON public.clients USING gin (to_tsvector('english'::regconfig, ((((((COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text)) || ' '::text) || COALESCE(company_name, ''::text)) || ' '::text) || COALESCE(email, ''::text))));



CREATE INDEX clients_square_id_idx ON public.clients USING btree (square_customer_id);



CREATE INDEX conversations_customer_idx ON public.conversations USING btree (customer_id);



CREATE INDEX conversations_status_idx ON public.conversations USING btree (status);



CREATE INDEX customers_account_id_idx ON public.customers USING btree (account_id);



CREATE INDEX customers_created_by_idx ON public.customers USING btree (created_by);



CREATE UNIQUE INDEX customers_email_uidx ON public.customers USING btree (email) WHERE (email IS NOT NULL);



CREATE INDEX customers_invited_at_idx ON public.customers USING btree (invited_at);



CREATE UNIQUE INDEX customers_phone_uidx ON public.customers USING btree (phone) WHERE (phone IS NOT NULL);



CREATE INDEX customers_status_idx ON public.customers USING btree (status);



CREATE INDEX customers_user_id_idx ON public.customers USING btree (user_id);



CREATE INDEX employee_profiles_employee_id_idx ON public.employee_profiles USING btree (employee_id);



CREATE INDEX employee_profiles_manager_id_idx ON public.employee_profiles USING btree (manager_id);



CREATE INDEX employee_profiles_status_idx ON public.employee_profiles USING btree (employment_status);



CREATE INDEX employee_profiles_user_id_idx ON public.employee_profiles USING btree (user_id);



CREATE INDEX estimates_client_id_idx ON public.estimates USING btree (client_id);



CREATE INDEX estimates_lead_id_idx ON public.estimates USING btree (lead_id);



CREATE INDEX estimates_status_created_at_idx ON public.estimates USING btree (status, created_at DESC);



CREATE INDEX gmail_connections_active_idx ON public.gmail_connections USING btree (is_active) WHERE (is_active = true);



CREATE INDEX gmail_connections_email_idx ON public.gmail_connections USING btree (email_address);



CREATE INDEX idx_account_memberships_permissions ON public.account_memberships USING gin (permissions);



CREATE INDEX idx_activity_log_actor ON public.activity_log USING btree (actor_user_id);



CREATE INDEX idx_activity_log_created ON public.activity_log USING btree (created_at);



CREATE INDEX idx_activity_log_entity ON public.activity_log USING btree (entity_type, entity_id);



CREATE INDEX idx_ai_estimate_settings_user_id ON public.ai_estimate_settings USING btree (user_id);



CREATE UNIQUE INDEX idx_ai_estimate_settings_user_unique ON public.ai_estimate_settings USING btree (user_id) WHERE (user_id IS NOT NULL);



CREATE INDEX idx_alerts_account_id ON public.alerts USING btree (account_id);



CREATE INDEX idx_alerts_email_id ON public.alerts USING btree (email_id);



CREATE INDEX idx_alerts_priority ON public.alerts USING btree (priority);



CREATE INDEX idx_alerts_status ON public.alerts USING btree (status);



CREATE INDEX idx_alerts_type ON public.alerts USING btree (type);



CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);



CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);



CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);



CREATE INDEX idx_audit_logs_severity ON public.audit_logs USING btree (severity);



CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);



CREATE INDEX idx_automations_related_id ON public.automations USING btree (related_id);



CREATE INDEX idx_automations_run_at ON public.automations USING btree (run_at);



CREATE INDEX idx_automations_status ON public.automations USING btree (status);



CREATE INDEX idx_billing_events_account_id ON public.billing_events USING btree (account_id);



CREATE INDEX idx_billing_events_due_date ON public.billing_events USING btree (due_date);



CREATE INDEX idx_billing_events_email_id ON public.billing_events USING btree (email_id);



CREATE INDEX idx_client_activities_client_created ON public.client_activities USING btree (client_id, created_at DESC);



CREATE INDEX idx_client_activities_client_id ON public.client_activities USING btree (client_id);



CREATE INDEX idx_client_activities_completed_at ON public.client_activities USING btree (completed_at);



CREATE INDEX idx_client_activities_created_at ON public.client_activities USING btree (created_at DESC);



CREATE INDEX idx_client_activities_due_date ON public.client_activities USING btree (due_date);



CREATE INDEX idx_client_activities_related ON public.client_activities USING btree (related_id, related_type);



CREATE INDEX idx_client_activities_type ON public.client_activities USING btree (activity_type);



CREATE INDEX idx_client_activities_type_client ON public.client_activities USING btree (activity_type, client_id);



CREATE INDEX idx_clients_email ON public.clients USING btree (email) WHERE (email IS NOT NULL);



CREATE INDEX idx_clients_phone ON public.clients USING btree (phone) WHERE (phone IS NOT NULL);



CREATE INDEX idx_contact_requests_created_at ON public.contact_requests USING btree (created_at);



CREATE INDEX idx_contact_requests_status ON public.contact_requests USING btree (status);



CREATE INDEX idx_contact_requests_user_id ON public.contact_requests USING btree (user_id);



CREATE INDEX idx_customer_communications_customer_id ON public.customer_communications USING btree (customer_id);



CREATE INDEX idx_customer_communications_followup_date ON public.customer_communications USING btree (followup_date) WHERE (followup_date IS NOT NULL);



CREATE INDEX idx_customer_communications_occurred_at ON public.customer_communications USING btree (occurred_at DESC);



CREATE INDEX idx_customer_communications_requires_followup ON public.customer_communications USING btree (requires_followup) WHERE (requires_followup = true);



CREATE INDEX idx_customer_communications_status ON public.customer_communications USING btree (status);



CREATE INDEX idx_customer_communications_tags ON public.customer_communications USING gin (tags);



CREATE INDEX idx_customer_communications_type ON public.customer_communications USING btree (communication_type);



CREATE INDEX idx_email_insights_account_id ON public.email_insights USING btree (account_id);



CREATE INDEX idx_email_insights_category ON public.email_insights USING btree (category);



CREATE INDEX idx_email_insights_email_id ON public.email_insights USING btree (email_id);



CREATE INDEX idx_email_insights_is_action_required ON public.email_insights USING btree (is_action_required);



CREATE INDEX idx_email_insights_priority ON public.email_insights USING btree (priority);



CREATE INDEX idx_email_lead_details_account_id ON public.email_lead_details USING btree (account_id);



CREATE INDEX idx_email_lead_details_email_id ON public.email_lead_details USING btree (email_id);



CREATE INDEX idx_email_lead_details_service_type ON public.email_lead_details USING btree (service_type);



CREATE INDEX idx_email_lead_details_urgency ON public.email_lead_details USING btree (urgency);



CREATE INDEX idx_email_templates_created_by ON public.email_templates USING btree (created_by);



CREATE UNIQUE INDEX idx_email_templates_default_type ON public.email_templates USING btree (type, is_default) WHERE (is_default = true);



CREATE INDEX idx_email_templates_type ON public.email_templates USING btree (type);



CREATE INDEX idx_emails_raw_account_id ON public.emails_raw USING btree (account_id);



CREATE INDEX idx_emails_raw_gmail_message_id ON public.emails_raw USING btree (gmail_message_id);



CREATE INDEX idx_emails_raw_is_read ON public.emails_raw USING btree (is_read);



CREATE INDEX idx_emails_raw_is_starred ON public.emails_raw USING btree (is_starred);



CREATE INDEX idx_emails_raw_received_at ON public.emails_raw USING btree (received_at DESC);



CREATE INDEX idx_estimate_templates_service_type ON public.estimate_templates USING btree (service_type);



CREATE INDEX idx_estimates_account_id ON public.estimates USING btree (account_id);



CREATE INDEX idx_estimates_client_id ON public.estimates USING btree (client_id);



CREATE INDEX idx_estimates_client_status ON public.estimates USING btree (client_id, status);



CREATE INDEX idx_estimates_created_at ON public.estimates USING btree (created_at);



CREATE INDEX idx_estimates_estimate_id ON public.jobs USING btree (estimate_id);



CREATE INDEX idx_estimates_estimate_number ON public.estimates USING btree (estimate_number);



CREATE INDEX idx_estimates_lead_id ON public.estimates USING btree (lead_id);



CREATE INDEX idx_estimates_property_id ON public.estimates USING btree (property_id);



CREATE INDEX idx_estimates_status ON public.estimates USING btree (status);



CREATE INDEX idx_estimates_status_created ON public.estimates USING btree (status, created_at DESC);



CREATE INDEX idx_estimates_valid_until ON public.estimates USING btree (valid_until);



CREATE INDEX idx_invoice_line_items_invoice_created ON public.invoice_line_items USING btree (invoice_id, created_at);



CREATE INDEX idx_invoice_line_items_invoice_id ON public.invoice_line_items USING btree (invoice_id);



CREATE INDEX idx_invoice_payments_invoice_created ON public.invoice_payments USING btree (invoice_id, created_at DESC);



CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments USING btree (invoice_id);



CREATE INDEX idx_invoice_reminders_invoice_id ON public.invoice_reminders USING btree (invoice_id);



CREATE INDEX idx_invoice_reminders_scheduled_for ON public.invoice_reminders USING btree (scheduled_for);



CREATE INDEX idx_invoice_reminders_status ON public.invoice_reminders USING btree (status);



CREATE INDEX idx_invoice_reminders_type ON public.invoice_reminders USING btree (reminder_type);



CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);



CREATE INDEX idx_invoices_client_status ON public.invoices USING btree (client_id, status);



CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);



CREATE INDEX idx_invoices_estimate_id ON public.invoices USING btree (estimate_id);



CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);



CREATE INDEX idx_invoices_job_id ON public.invoices USING btree (job_id);



CREATE INDEX idx_invoices_outstanding ON public.invoices USING btree (due_date) WHERE (status <> 'paid'::text);



CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);



CREATE INDEX idx_invoices_status_due_date ON public.invoices USING btree (status, due_date);



CREATE INDEX idx_job_checklist_items_job_id ON public.job_checklist_items USING btree (job_id);



CREATE INDEX idx_job_checklist_items_sort_order ON public.job_checklist_items USING btree (sort_order);



CREATE INDEX idx_job_line_items_job_created ON public.job_line_items USING btree (job_id, created_at);



CREATE INDEX idx_job_line_items_service_id ON public.job_line_items USING btree (service_id);



CREATE INDEX idx_job_materials_job_id ON public.job_materials USING btree (job_id);



CREATE INDEX idx_job_materials_material_id ON public.job_materials USING btree (material_id);



CREATE INDEX idx_job_notes_created_at ON public.job_notes USING btree (created_at);



CREATE INDEX idx_job_notes_job_id ON public.job_notes USING btree (job_id);



CREATE INDEX idx_job_notes_technician_id ON public.job_notes USING btree (technician_id);



CREATE INDEX idx_job_photos_account_id ON public.job_photos USING btree (account_id);



CREATE INDEX idx_job_template_usage_job ON public.job_template_usage USING btree (job_id);



CREATE INDEX idx_job_template_usage_template ON public.job_template_usage USING btree (template_id);



CREATE INDEX idx_job_templates_category ON public.job_templates USING btree (category);



CREATE INDEX idx_job_templates_created_by ON public.job_templates USING btree (created_by);



CREATE INDEX idx_job_templates_is_public ON public.job_templates USING btree (is_public) WHERE (is_public = true);



CREATE INDEX idx_job_templates_usage_count ON public.job_templates USING btree (usage_count DESC);



CREATE INDEX idx_job_tools_job_id ON public.job_tools USING btree (job_id);



CREATE INDEX idx_job_tools_material_id ON public.job_tools USING btree (material_id);



CREATE INDEX idx_job_tools_status ON public.job_tools USING btree (status);



CREATE INDEX idx_job_workflow_executions_executed_at ON public.job_workflow_executions USING btree (executed_at DESC);



CREATE INDEX idx_job_workflow_executions_job_id ON public.job_workflow_executions USING btree (job_id);



CREATE INDEX idx_job_workflow_executions_workflow_id ON public.job_workflow_executions USING btree (workflow_id);



CREATE INDEX idx_job_workflows_trigger_status ON public.job_workflows USING btree (trigger_status) WHERE (is_active = true);



CREATE INDEX idx_jobs_assigned_tech_id ON public.jobs USING btree (assigned_tech_id);



CREATE INDEX idx_jobs_client_status ON public.jobs USING btree (client_id, status);



CREATE INDEX idx_jobs_estimate_id ON public.jobs USING btree (estimate_id);



CREATE INDEX idx_jobs_scheduled_for ON public.jobs USING btree (scheduled_for);



CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);



CREATE INDEX idx_jobs_status_created ON public.jobs USING btree (status, created_at DESC);



CREATE INDEX idx_jobs_status_service_date ON public.jobs USING btree (status, service_date) WHERE (service_date IS NOT NULL);



CREATE INDEX idx_lead_activities_created_at ON public.lead_activities USING btree (created_at);



CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);



CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at);



CREATE INDEX idx_leads_email ON public.leads USING btree (email);



CREATE INDEX idx_leads_follow_up_date ON public.leads USING btree (follow_up_date);



CREATE INDEX idx_leads_phone ON public.leads USING btree (phone);



CREATE INDEX idx_leads_priority ON public.leads USING btree (priority);



CREATE INDEX idx_leads_source ON public.leads USING btree (source);



CREATE INDEX idx_leads_status ON public.leads USING btree (status);



CREATE INDEX idx_material_transactions_created_at ON public.material_transactions USING btree (created_at);



CREATE INDEX idx_material_transactions_material_id ON public.material_transactions USING btree (material_id);



CREATE INDEX idx_materials_category ON public.materials USING btree (category);



CREATE INDEX idx_materials_name ON public.materials USING btree (name);



CREATE INDEX idx_materials_sku ON public.materials USING btree (sku);



CREATE INDEX idx_payments_job_created ON public.payments USING btree (job_id, created_at DESC);



CREATE INDEX idx_security_settings_created_at ON public.security_settings USING btree (created_at);



CREATE INDEX idx_team_assignments_job_id ON public.team_assignments USING btree (job_id);



CREATE INDEX idx_team_assignments_status ON public.team_assignments USING btree (status);



CREATE INDEX idx_team_assignments_user_id ON public.team_assignments USING btree (user_id);



CREATE INDEX idx_team_availability_day ON public.team_availability USING btree (day_of_week);



CREATE INDEX idx_team_availability_user_id ON public.team_availability USING btree (user_id);



CREATE INDEX idx_team_schedules_date ON public.team_schedules USING btree (scheduled_date);



CREATE INDEX idx_team_schedules_type ON public.team_schedules USING btree (schedule_type);



CREATE INDEX idx_team_schedules_user_id ON public.team_schedules USING btree (user_id);



CREATE INDEX idx_technician_locations_job_id ON public.technician_locations USING btree (job_id);



CREATE INDEX idx_technician_locations_technician_id ON public.technician_locations USING btree (technician_id);



CREATE INDEX idx_technician_locations_timestamp ON public.technician_locations USING btree ("timestamp");



CREATE INDEX idx_technician_rates_effective_date ON public.technician_rates USING btree (effective_date);



CREATE INDEX idx_technician_rates_technician_id ON public.technician_rates USING btree (technician_id);



CREATE INDEX idx_time_approvals_status ON public.time_approvals USING btree (status);



CREATE INDEX idx_time_approvals_time_entry_id ON public.time_approvals USING btree (time_entry_id);



CREATE INDEX idx_time_breaks_start_time ON public.time_breaks USING btree (start_time);



CREATE INDEX idx_time_breaks_time_entry_id ON public.time_breaks USING btree (time_entry_id);



CREATE INDEX idx_time_entries_assignment_id ON public.time_entries USING btree (assignment_id);



CREATE INDEX idx_time_entries_clock_in ON public.time_entries USING btree (clock_in);



CREATE INDEX idx_time_entries_end_time ON public.time_entries USING btree (end_time);



CREATE INDEX idx_time_entries_job_id ON public.time_entries USING btree (job_id);



CREATE INDEX idx_time_entries_start_time ON public.time_entries USING btree (start_time);



CREATE INDEX idx_time_entries_status ON public.time_entries USING btree (status);



CREATE INDEX idx_time_entries_technician_id ON public.time_entries USING btree (technician_id);



CREATE INDEX idx_time_entries_user_id ON public.time_entries USING btree (user_id);



CREATE INDEX idx_tool_assignments_assigned_date ON public.tool_assignments USING btree (assigned_date);



CREATE INDEX idx_tool_assignments_assigned_to ON public.tool_assignments USING btree (assigned_to_name);



CREATE INDEX idx_tool_assignments_material_id ON public.tool_assignments USING btree (material_id);



CREATE INDEX idx_tool_assignments_status ON public.tool_assignments USING btree (status);



CREATE INDEX idx_tool_images_is_primary ON public.tool_images USING btree (material_id, is_primary);



CREATE INDEX idx_tool_images_material_id ON public.tool_images USING btree (material_id);



CREATE INDEX idx_tool_inventory_counts_location ON public.tool_inventory_counts USING btree (location);



CREATE INDEX idx_tool_inventory_counts_status ON public.tool_inventory_counts USING btree (status);



CREATE INDEX idx_tool_maintenance_material_id ON public.tool_maintenance USING btree (material_id);



CREATE INDEX idx_tool_maintenance_scheduled_date ON public.tool_maintenance USING btree (scheduled_date);



CREATE INDEX idx_tool_maintenance_status ON public.tool_maintenance USING btree (status);



CREATE INDEX idx_tool_recognition_matches_confidence ON public.tool_recognition_matches USING btree (confidence_score DESC);



CREATE INDEX idx_tool_recognition_matches_material_id ON public.tool_recognition_matches USING btree (material_id);



CREATE INDEX idx_tool_recognition_matches_recognition_result_id ON public.tool_recognition_matches USING btree (recognition_result_id);



CREATE INDEX idx_tool_recognition_results_image_hash ON public.tool_recognition_results USING btree (image_hash);



CREATE INDEX idx_tool_recognition_results_status ON public.tool_recognition_results USING btree (processing_status);



CREATE INDEX idx_visits_account_id ON public.visits USING btree (account_id);



CREATE INDEX idx_visits_job_id ON public.visits USING btree (job_id);



CREATE INDEX idx_visits_start_at ON public.visits USING btree (start_at);



CREATE INDEX idx_visits_status ON public.visits USING btree (status);



CREATE INDEX idx_visits_technician_id ON public.visits USING btree (technician_id);



CREATE INDEX job_line_items_job_id_idx ON public.job_line_items USING btree (job_id);



CREATE INDEX job_photos_created_at_idx ON public.job_photos USING btree (created_at);



CREATE INDEX job_photos_job_id_idx ON public.job_photos USING btree (job_id);



CREATE INDEX job_photos_photo_type_idx ON public.job_photos USING btree (photo_type);



CREATE INDEX jobs_active_status_idx ON public.jobs USING btree (status) WHERE (status <> ALL (ARRAY['completed'::text, 'invoiced'::text, 'cancelled'::text]));



CREATE INDEX jobs_client_id_idx ON public.jobs USING btree (client_id);



CREATE INDEX jobs_client_status_idx ON public.jobs USING btree (client_id, status);



CREATE INDEX jobs_job_number_idx ON public.jobs USING btree (job_number);



CREATE INDEX jobs_property_id_idx ON public.jobs USING btree (property_id) WHERE (property_id IS NOT NULL);



CREATE INDEX jobs_scheduled_date_idx ON public.jobs USING btree (service_date) WHERE (service_date IS NOT NULL);



CREATE INDEX jobs_service_date_idx ON public.jobs USING btree (service_date);



CREATE INDEX jobs_status_created_at_idx ON public.jobs USING btree (status, created_at DESC);



CREATE INDEX jobs_status_idx ON public.jobs USING btree (status);



CREATE INDEX leads_source_idx ON public.leads USING btree (source);



CREATE INDEX leads_status_created_at_idx ON public.leads USING btree (status, created_at DESC);



CREATE INDEX materials_category_idx ON public.materials USING btree (category);



CREATE INDEX materials_name_idx ON public.materials USING btree (name);



CREATE INDEX messages_conversation_idx ON public.messages USING btree (conversation_id);



CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);



CREATE INDEX messages_customer_idx ON public.messages USING btree (customer_id);



CREATE INDEX payments_job_id_idx ON public.payments USING btree (job_id);



CREATE INDEX payments_payment_date_idx ON public.payments USING btree (payment_date);



CREATE INDEX payments_square_payment_id_idx ON public.payments USING btree (square_payment_id);



CREATE INDEX profile_change_requests_expires_at_idx ON public.profile_change_requests USING btree (expires_at);



CREATE INDEX profile_change_requests_status_idx ON public.profile_change_requests USING btree (status);



CREATE INDEX profile_change_requests_user_id_idx ON public.profile_change_requests USING btree (user_id);



CREATE INDEX properties_client_id_idx ON public.properties USING btree (client_id);



CREATE INDEX properties_client_type_idx ON public.properties USING btree (client_id, property_type);



CREATE INDEX properties_search_idx ON public.properties USING gin (to_tsvector('english'::regconfig, ((((((((COALESCE(name, ''::text) || ' '::text) || COALESCE(address_line1, ''::text)) || ' '::text) || COALESCE(city, ''::text)) || ' '::text) || COALESCE(state, ''::text)) || ' '::text) || COALESCE(property_type, ''::text))));



CREATE INDEX square_connections_merchant_id_idx ON public.square_connections USING btree (merchant_id);



CREATE INDEX time_entries_job_id_idx ON public.time_entries USING btree (job_id);



CREATE INDEX time_entries_job_start_time_idx ON public.time_entries USING btree (job_id, start_time);



CREATE INDEX time_entries_start_time_idx ON public.time_entries USING btree (start_time);



CREATE OR REPLACE VIEW public.job_time_summary AS
 SELECT j.id AS job_id,
    j.account_id,
    j.job_number,
    j.title,
    COALESCE(c.company_name, ((c.first_name || ' '::text) || c.last_name)) AS client_name,
    count(te.id) AS time_entries,
    sum(te.total_hours) AS total_hours,
    sum(te.billable_hours) AS billable_hours,
    sum(te.total_amount) AS total_billed,
    avg(te.hourly_rate) AS avg_hourly_rate,
    min(te.start_time) AS first_clock_in,
    max(te.end_time) AS last_clock_out
   FROM ((public.jobs j
     LEFT JOIN public.clients c ON ((j.client_id = c.id)))
     LEFT JOIN public.time_entries te ON (((j.id = te.job_id) AND ((te.account_id = j.account_id) OR (te.account_id IS NULL)))))
  GROUP BY j.id, j.account_id, j.job_number, j.title, c.first_name, c.last_name, c.company_name
  ORDER BY j.created_at DESC;



CREATE TRIGGER auto_create_invoice_reminders_trigger AFTER INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.auto_create_invoice_reminders();



CREATE TRIGGER business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.update_business_settings_updated_at();



CREATE TRIGGER customer_communications_updated_at BEFORE UPDATE ON public.customer_communications FOR EACH ROW EXECUTE FUNCTION public.update_customer_communications_updated_at();



CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_email_templates_updated_at();



CREATE TRIGGER employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_employee_profile_updated_at();



CREATE TRIGGER estimate_templates_updated_at BEFORE UPDATE ON public.estimate_templates FOR EACH ROW EXECUTE FUNCTION public.update_estimates_updated_at();



CREATE TRIGGER estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_estimates_updated_at();



CREATE TRIGGER invoice_reminders_updated_at BEFORE UPDATE ON public.invoice_reminders FOR EACH ROW EXECUTE FUNCTION public.update_invoice_reminders_updated_at();



CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_invoices_updated_at();



CREATE TRIGGER job_status_change_workflows AFTER UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trigger_job_workflows();



CREATE TRIGGER job_templates_updated_at BEFORE UPDATE ON public.job_templates FOR EACH ROW EXECUTE FUNCTION public.update_job_templates_updated_at();



CREATE TRIGGER job_workflows_updated_at BEFORE UPDATE ON public.job_workflows FOR EACH ROW EXECUTE FUNCTION public.update_job_workflows_updated_at();



CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_leads_updated_at();



CREATE TRIGGER set_estimate_number_trigger BEFORE INSERT ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.set_estimate_number();



CREATE TRIGGER set_invoice_number_trigger BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();



CREATE TRIGGER team_assignments_updated_at BEFORE UPDATE ON public.team_assignments FOR EACH ROW EXECUTE FUNCTION public.update_team_assignments_updated_at();



CREATE TRIGGER team_schedules_updated_at BEFORE UPDATE ON public.team_schedules FOR EACH ROW EXECUTE FUNCTION public.update_team_schedules_updated_at();



CREATE TRIGGER time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_time_entries_updated_at();



CREATE TRIGGER trigger_calculate_break_duration BEFORE INSERT OR UPDATE ON public.time_breaks FOR EACH ROW EXECUTE FUNCTION public.calculate_break_duration();



CREATE TRIGGER trigger_calculate_time_entry_totals BEFORE INSERT OR UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.calculate_time_entry_totals();



CREATE TRIGGER trigger_process_tool_recognition_matches AFTER INSERT ON public.tool_recognition_results FOR EACH ROW WHEN ((new.processing_status = 'completed'::text)) EXECUTE FUNCTION public.process_tool_recognition_matches();



CREATE TRIGGER trigger_schedule_next_maintenance AFTER UPDATE ON public.tool_maintenance FOR EACH ROW EXECUTE FUNCTION public.schedule_next_maintenance();



CREATE TRIGGER trigger_update_ai_estimate_settings_updated_at BEFORE UPDATE ON public.ai_estimate_settings FOR EACH ROW EXECUTE FUNCTION public.update_ai_estimate_settings_updated_at();



CREATE TRIGGER trigger_update_material_stock_on_job_usage AFTER INSERT ON public.job_materials FOR EACH ROW EXECUTE FUNCTION public.update_material_stock_on_job_usage();



CREATE TRIGGER trigger_update_security_settings_updated_at BEFORE UPDATE ON public.security_settings FOR EACH ROW EXECUTE FUNCTION public.update_security_settings_updated_at();



CREATE TRIGGER trigger_update_tool_status_on_assignment AFTER INSERT OR UPDATE ON public.tool_assignments FOR EACH ROW EXECUTE FUNCTION public.update_tool_status_on_assignment();



CREATE TRIGGER update_client_activities_updated_at BEFORE UPDATE ON public.client_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON public.contact_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_job_checklist_items_updated_at BEFORE UPDATE ON public.job_checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_job_notes_updated_at BEFORE UPDATE ON public.job_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_job_payment_after_delete AFTER DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_job_payment_status_on_delete();



CREATE TRIGGER update_job_payment_after_insert AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_job_payment_status();



CREATE TRIGGER update_job_payment_after_update AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_job_payment_status();



CREATE TRIGGER update_job_photos_updated_at BEFORE UPDATE ON public.job_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER update_square_connections_updated_at BEFORE UPDATE ON public.square_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



ALTER TABLE ONLY public.account_memberships
    ADD CONSTRAINT account_memberships_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.account_memberships
    ADD CONSTRAINT account_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.ai_estimate_settings
    ADD CONSTRAINT ai_estimate_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);



ALTER TABLE ONLY public.automation_history
    ADD CONSTRAINT automation_history_automation_id_fkey FOREIGN KEY (automation_id) REFERENCES public.automations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.billing_events
    ADD CONSTRAINT billing_events_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.client_activities
    ADD CONSTRAINT client_activities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);



ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.clients(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);



ALTER TABLE ONLY public.customer_communications
    ADD CONSTRAINT customer_communications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);



ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);



ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.email_insights
    ADD CONSTRAINT email_insights_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.email_lead_details
    ADD CONSTRAINT email_lead_details_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.emails_raw
    ADD CONSTRAINT emails_raw_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES auth.users(id);



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.employee_profiles
    ADD CONSTRAINT employee_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_converted_to_job_id_fkey FOREIGN KEY (converted_to_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.gmail_connections
    ADD CONSTRAINT gmail_connections_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoice_reminders
    ADD CONSTRAINT invoice_reminders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.invoice_reminders
    ADD CONSTRAINT invoice_reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimates(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_checklist_items
    ADD CONSTRAINT job_checklist_items_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_line_items
    ADD CONSTRAINT job_line_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_line_items
    ADD CONSTRAINT job_line_items_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_materials
    ADD CONSTRAINT job_materials_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_materials
    ADD CONSTRAINT job_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_notes
    ADD CONSTRAINT job_notes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_notes
    ADD CONSTRAINT job_notes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_notes
    ADD CONSTRAINT job_notes_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id);



ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT job_photos_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_photos
    ADD CONSTRAINT job_photos_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_template_usage
    ADD CONSTRAINT job_template_usage_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.job_tools
    ADD CONSTRAINT job_tools_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_tools
    ADD CONSTRAINT job_tools_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_workflow_executions
    ADD CONSTRAINT job_workflow_executions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.job_workflow_executions
    ADD CONSTRAINT job_workflow_executions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_workflow_executions
    ADD CONSTRAINT job_workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.job_workflows(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.job_workflows
    ADD CONSTRAINT job_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_assigned_tech_id_fkey FOREIGN KEY (assigned_tech_id) REFERENCES public.users(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimates(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_converted_to_client_id_fkey FOREIGN KEY (converted_to_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.material_transactions
    ADD CONSTRAINT material_transactions_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.profile_change_requests
    ADD CONSTRAINT profile_change_requests_employee_profile_id_fkey FOREIGN KEY (employee_profile_id) REFERENCES public.employee_profiles(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.profile_change_requests
    ADD CONSTRAINT profile_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.profile_change_requests
    ADD CONSTRAINT profile_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.profile_change_requests
    ADD CONSTRAINT profile_change_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.square_connections
    ADD CONSTRAINT square_connections_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.team_assignments
    ADD CONSTRAINT team_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.team_assignments
    ADD CONSTRAINT team_assignments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.team_assignments
    ADD CONSTRAINT team_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.team_availability
    ADD CONSTRAINT team_availability_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.team_schedules
    ADD CONSTRAINT team_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);



ALTER TABLE ONLY public.team_schedules
    ADD CONSTRAINT team_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.technician_locations
    ADD CONSTRAINT technician_locations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);



ALTER TABLE ONLY public.time_approvals
    ADD CONSTRAINT time_approvals_time_entry_id_fkey FOREIGN KEY (time_entry_id) REFERENCES public.time_entries(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.time_breaks
    ADD CONSTRAINT time_breaks_time_entry_id_fkey FOREIGN KEY (time_entry_id) REFERENCES public.time_entries(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.team_assignments(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.tool_assignments
    ADD CONSTRAINT tool_assignments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;



ALTER TABLE ONLY public.tool_assignments
    ADD CONSTRAINT tool_assignments_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.tool_images
    ADD CONSTRAINT tool_images_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.tool_inventory_counts
    ADD CONSTRAINT tool_inventory_counts_recognition_result_id_fkey FOREIGN KEY (recognition_result_id) REFERENCES public.tool_recognition_results(id);



ALTER TABLE ONLY public.tool_maintenance
    ADD CONSTRAINT tool_maintenance_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.tool_recognition_matches
    ADD CONSTRAINT tool_recognition_matches_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.tool_recognition_matches
    ADD CONSTRAINT tool_recognition_matches_recognition_result_id_fkey FOREIGN KEY (recognition_result_id) REFERENCES public.tool_recognition_results(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;



CREATE POLICY "Account members can view time entries" ON public.time_entries FOR SELECT USING (
CASE
    WHEN (account_id IS NOT NULL) THEN (account_id IN ( SELECT account_memberships.account_id
       FROM public.account_memberships
      WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true))))
    ELSE true
END);



CREATE POLICY "Admins can delete memberships" ON public.account_memberships FOR DELETE USING (public.user_is_account_admin(account_id));



CREATE POLICY "Admins can insert memberships" ON public.account_memberships FOR INSERT WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY "Admins can manage all assignments" ON public.team_assignments USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can manage all availability" ON public.team_availability USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can manage all contact requests" ON public.contact_requests USING ((EXISTS ( SELECT 1
   FROM public.account_memberships am
  WHERE ((am.user_id = auth.uid()) AND (am.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (am.is_active = true)))));



CREATE POLICY "Admins can manage all schedules" ON public.team_schedules USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can manage automations" ON public.automations USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY "Admins can manage materials" ON public.materials USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY "Admins can update change requests" ON public.profile_change_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true) AND (account_memberships.role = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can update employee profiles" ON public.employee_profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true) AND (account_memberships.role = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can update memberships" ON public.account_memberships FOR UPDATE USING (public.user_is_account_admin(account_id));



CREATE POLICY "Admins can update settings" ON public.business_settings USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY "Admins can view all account memberships" ON public.account_memberships FOR SELECT USING (public.user_is_account_admin(account_id));



CREATE POLICY "Admins can view all assignments" ON public.team_assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can view all change requests" ON public.profile_change_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true) AND (account_memberships.role = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can view all employee profiles" ON public.employee_profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true) AND (account_memberships.role = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Admins can view all time entries" ON public.time_entries FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['ADMIN'::text, 'OWNER'::text]))))));



CREATE POLICY "Allow all operations on account_memberships" ON public.account_memberships TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on customers" ON public.customers TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on estimates" ON public.estimates TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on invoices" ON public.invoices TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on leads" ON public.leads TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on properties" ON public.properties TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on technician_locations" ON public.technician_locations TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on technician_rates" ON public.technician_rates TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on time_approvals" ON public.time_approvals TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on time_breaks" ON public.time_breaks TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on time_entries" ON public.time_entries TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on visits" ON public.visits TO service_role USING (true) WITH CHECK (true);



CREATE POLICY "Allow inserting template usage" ON public.job_template_usage FOR INSERT WITH CHECK (true);



CREATE POLICY "Audit log access" ON public.audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text]))))));



CREATE POLICY "Audit log insertion" ON public.audit_logs FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can view automations" ON public.automations FOR SELECT USING ((auth.uid() IS NOT NULL));



CREATE POLICY "Authenticated users can view materials" ON public.materials FOR SELECT USING ((auth.uid() IS NOT NULL));



CREATE POLICY "Authenticated users can view settings" ON public.business_settings FOR SELECT USING ((auth.uid() IS NOT NULL));



CREATE POLICY "Owners can update their account" ON public.accounts FOR UPDATE USING (public.user_is_account_admin(id));



CREATE POLICY "Security settings access" ON public.security_settings USING ((EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text]))))));



CREATE POLICY "Staff can manage time entries" ON public.time_entries USING (
CASE
    WHEN (account_id IS NOT NULL) THEN (account_id IN ( SELECT account_memberships.account_id
       FROM public.account_memberships
      WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true))))
    ELSE true
END);



CREATE POLICY "Technicians and admins can manage checklist items" ON public.job_checklist_items USING ((EXISTS ( SELECT 1
   FROM (public.account_memberships am
     JOIN public.jobs j ON ((j.id = job_checklist_items.job_id)))
  WHERE ((am.user_id = auth.uid()) AND (am.account_id = j.account_id) AND (am.role = ANY (ARRAY['admin'::text, 'owner'::text, 'tech'::text])) AND (am.is_active = true)))));



CREATE POLICY "Users can create assignments they assign" ON public.team_assignments FOR INSERT WITH CHECK ((auth.uid() = assigned_by));



CREATE POLICY "Users can create customer communications" ON public.customer_communications FOR INSERT WITH CHECK ((auth.uid() = created_by));



CREATE POLICY "Users can create own change requests" ON public.profile_change_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));



CREATE POLICY "Users can create reminders for their invoices" ON public.invoice_reminders FOR INSERT WITH CHECK ((auth.uid() = created_by));



CREATE POLICY "Users can create their own templates" ON public.job_templates FOR INSERT WITH CHECK ((auth.uid() = created_by));



CREATE POLICY "Users can create workflows" ON public.job_workflows FOR INSERT WITH CHECK ((auth.uid() = created_by));



CREATE POLICY "Users can delete customer communications" ON public.customer_communications FOR DELETE USING ((auth.uid() = created_by));



CREATE POLICY "Users can delete reminders for their invoices" ON public.invoice_reminders FOR DELETE USING ((auth.uid() = created_by));



CREATE POLICY "Users can delete their own email templates" ON public.email_templates FOR DELETE USING ((auth.uid() = created_by));



CREATE POLICY "Users can delete their own estimate settings" ON public.ai_estimate_settings FOR DELETE USING ((auth.uid() = user_id));



CREATE POLICY "Users can delete their own templates" ON public.job_templates FOR DELETE USING ((auth.uid() = created_by));



CREATE POLICY "Users can delete their workflows" ON public.job_workflows FOR DELETE USING ((auth.uid() = created_by));



CREATE POLICY "Users can insert estimate settings" ON public.ai_estimate_settings FOR INSERT WITH CHECK (((auth.uid() = user_id) OR ((user_id IS NULL) AND (EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text]))))))));



CREATE POLICY "Users can insert own profile" ON public.employee_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));



CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK ((id = auth.uid()));



CREATE POLICY "Users can insert their own email templates" ON public.email_templates FOR INSERT WITH CHECK ((auth.uid() = created_by));



CREATE POLICY "Users can manage their own availability" ON public.team_availability USING ((auth.uid() = user_id));



CREATE POLICY "Users can manage their own schedules" ON public.team_schedules USING ((auth.uid() = user_id));



CREATE POLICY "Users can manage their own time entries" ON public.time_entries USING ((auth.uid() = user_id));



CREATE POLICY "Users can update customer communications" ON public.customer_communications FOR UPDATE USING ((auth.uid() = created_by));



CREATE POLICY "Users can update estimate settings" ON public.ai_estimate_settings FOR UPDATE USING (((auth.uid() = user_id) OR ((user_id IS NULL) AND (EXISTS ( SELECT 1
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text]))))))));



CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((id = auth.uid()));



CREATE POLICY "Users can update reminders for their invoices" ON public.invoice_reminders FOR UPDATE USING ((auth.uid() = created_by));



CREATE POLICY "Users can update their own assignments" ON public.team_assignments FOR UPDATE USING ((auth.uid() = user_id));



CREATE POLICY "Users can update their own email templates" ON public.email_templates FOR UPDATE USING ((auth.uid() = created_by));



CREATE POLICY "Users can update their own templates" ON public.job_templates FOR UPDATE USING ((auth.uid() = created_by));



CREATE POLICY "Users can update their workflows" ON public.job_workflows FOR UPDATE USING ((auth.uid() = created_by));



CREATE POLICY "Users can view active workflows" ON public.job_workflows FOR SELECT USING (true);



CREATE POLICY "Users can view activity in their account" ON public.activity_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships am
  WHERE ((am.user_id = auth.uid()) AND (am.account_id = ( SELECT account_memberships.account_id
           FROM public.account_memberships
          WHERE (account_memberships.user_id = activity_log.actor_user_id)
         LIMIT 1)) AND (am.is_active = true)))));



CREATE POLICY "Users can view all email templates" ON public.email_templates FOR SELECT USING (true);



CREATE POLICY "Users can view all team availability" ON public.team_availability FOR SELECT USING (true);



CREATE POLICY "Users can view all team schedules" ON public.team_schedules FOR SELECT USING (true);



CREATE POLICY "Users can view assignments for jobs they're assigned to" ON public.team_assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = team_assignments.job_id) AND (jobs.assigned_tech_id = auth.uid())))));



CREATE POLICY "Users can view customer communications" ON public.customer_communications FOR SELECT USING (true);



CREATE POLICY "Users can view own change requests" ON public.profile_change_requests FOR SELECT USING ((auth.uid() = user_id));



CREATE POLICY "Users can view own employee profile" ON public.employee_profiles FOR SELECT USING ((auth.uid() = user_id));



CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((id = auth.uid()));



CREATE POLICY "Users can view public templates and their own templates" ON public.job_templates FOR SELECT USING (((is_public = true) OR (created_by = auth.uid())));



CREATE POLICY "Users can view reminders for their invoices" ON public.invoice_reminders FOR SELECT USING (true);



CREATE POLICY "Users can view their accounts" ON public.accounts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships am
  WHERE ((am.account_id = accounts.id) AND (am.user_id = auth.uid()) AND (am.is_active = true)))));



CREATE POLICY "Users can view their own assignments" ON public.team_assignments FOR SELECT USING ((auth.uid() = user_id));



CREATE POLICY "Users can view their own contact requests" ON public.contact_requests FOR SELECT USING ((auth.uid() = user_id));



CREATE POLICY "Users can view their own estimate settings" ON public.ai_estimate_settings FOR SELECT USING (((auth.uid() = user_id) OR (user_id IS NULL)));



CREATE POLICY "Users can view their own memberships" ON public.account_memberships FOR SELECT USING ((user_id = auth.uid()));



CREATE POLICY "Users can view their own time entries" ON public.time_entries FOR SELECT USING ((auth.uid() = user_id));



CREATE POLICY "account members can view technician_locations" ON public.technician_locations FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY "account members can view technician_rates" ON public.technician_rates FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY "account members can view time_approvals" ON public.time_approvals FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY "account members can view time_breaks" ON public.time_breaks FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins manage technician_rates" ON public.technician_rates USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



ALTER TABLE public.ai_estimate_settings ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.email_insights ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.email_lead_details ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.emails_raw ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_checklist_items ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_line_items ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;


CREATE POLICY job_notes_account_read ON public.job_notes FOR SELECT USING ((account_id = (current_setting('request.jwt.claim.account_id'::text, true))::uuid));



CREATE POLICY job_notes_admin_manage ON public.job_notes USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY job_notes_tech_insert_assigned ON public.job_notes FOR INSERT WITH CHECK (((technician_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_notes.job_id) AND (j.assigned_tech_id = auth.uid()) AND (j.account_id = job_notes.account_id))))));



ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_template_usage ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.job_workflows ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;


CREATE POLICY mvp_admin_manage_clients ON public.clients USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_customers ON public.customers USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_estimates ON public.estimates USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_gmail_connections ON public.gmail_connections USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_invoice_line_items ON public.invoice_line_items USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_invoice_payments ON public.invoice_payments USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_invoices ON public.invoices USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_job_line_items ON public.job_line_items USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_job_photos ON public.job_photos USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_jobs ON public.jobs USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_leads ON public.leads USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_payments ON public.payments USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_properties ON public.properties USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_square_connections ON public.square_connections USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_manage_visits ON public.visits USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_read_clients ON public.clients FOR SELECT USING (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_read_leads ON public.leads FOR SELECT USING (public.user_is_account_admin(account_id));



CREATE POLICY mvp_admin_read_properties ON public.properties FOR SELECT USING (public.user_is_account_admin(account_id));



CREATE POLICY mvp_customer_read_invoice_line_items ON public.invoice_line_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.invoices i
     JOIN public.jobs j ON ((j.id = i.job_id)))
  WHERE ((i.id = invoice_line_items.invoice_id) AND (j.customer_id = public.current_customer_id()) AND (i.account_id = invoice_line_items.account_id)))));



CREATE POLICY mvp_customer_read_invoice_payments ON public.invoice_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.invoices i
     JOIN public.jobs j ON ((j.id = i.job_id)))
  WHERE ((i.id = invoice_payments.invoice_id) AND (j.customer_id = public.current_customer_id()) AND (i.account_id = invoice_payments.account_id)))));



CREATE POLICY mvp_customer_read_job_line_items ON public.job_line_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_line_items.job_id) AND (j.customer_id = public.current_customer_id()) AND (j.account_id = job_line_items.account_id)))));



CREATE POLICY mvp_customer_read_job_photos ON public.job_photos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_photos.job_id) AND (j.customer_id = public.current_customer_id()) AND (j.account_id = job_photos.account_id)))));



CREATE POLICY mvp_customer_read_own_estimates ON public.estimates FOR SELECT USING (((customer_id = public.current_customer_id()) AND (account_id = public.current_customer_account_id())));



CREATE POLICY mvp_customer_read_own_invoices ON public.invoices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = invoices.job_id) AND (j.customer_id = public.current_customer_id()) AND (j.account_id = invoices.account_id)))));



CREATE POLICY mvp_customer_read_own_jobs ON public.jobs FOR SELECT USING (((customer_id = public.current_customer_id()) AND (account_id = public.current_customer_account_id())));



CREATE POLICY mvp_customer_read_payments ON public.payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = payments.job_id) AND (j.customer_id = public.current_customer_id()) AND (j.account_id = payments.account_id)))));



CREATE POLICY mvp_customer_read_self ON public.customers FOR SELECT USING ((user_id = auth.uid()));



CREATE POLICY mvp_customer_update_self ON public.customers FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));



CREATE POLICY mvp_tech_read_assigned_jobs ON public.jobs FOR SELECT USING (((assigned_tech_id = auth.uid()) AND public.user_is_account_tech(account_id)));



CREATE POLICY mvp_tech_read_assigned_visits ON public.visits FOR SELECT USING (((technician_id = auth.uid()) AND public.user_is_account_tech(account_id)));



CREATE POLICY mvp_tech_read_job_line_items ON public.job_line_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_line_items.job_id) AND (j.assigned_tech_id = auth.uid()) AND (j.account_id = job_line_items.account_id)))));



CREATE POLICY mvp_tech_read_job_photos ON public.job_photos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.id = job_photos.job_id) AND (j.assigned_tech_id = auth.uid()) AND (j.account_id = job_photos.account_id)))));



ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;


CREATE POLICY recon_activity_log_select ON public.activity_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.account_memberships am
  WHERE ((am.user_id = auth.uid()) AND (am.is_active = true) AND (am.account_id = ( SELECT account_memberships.account_id
           FROM public.account_memberships
          WHERE (account_memberships.user_id = activity_log.actor_user_id)
         LIMIT 1))))));



CREATE POLICY recon_alerts_admin_manage ON public.alerts USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_alerts_select ON public.alerts FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_billing_events_admin_manage ON public.billing_events USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_billing_events_select ON public.billing_events FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_email_insights_admin_manage ON public.email_insights USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_email_insights_select ON public.email_insights FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_email_lead_details_admin_manage ON public.email_lead_details USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_email_lead_details_select ON public.email_lead_details FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_emails_raw_admin_manage ON public.emails_raw USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_emails_raw_select ON public.emails_raw FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_estimate_templates_select ON public.estimate_templates FOR SELECT USING ((auth.uid() IS NOT NULL));



CREATE POLICY recon_estimate_templates_service_role_manage ON public.estimate_templates USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));



CREATE POLICY recon_estimates_admin_manage ON public.estimates USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_estimates_select ON public.estimates FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



CREATE POLICY recon_job_photos_admin_manage ON public.job_photos USING (public.user_is_account_admin(account_id)) WITH CHECK (public.user_is_account_admin(account_id));



CREATE POLICY recon_job_photos_select ON public.job_photos FOR SELECT USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.is_active = true)))));



ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.square_connections ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.team_availability ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.team_schedules ENABLE ROW LEVEL SECURITY;


CREATE POLICY tech_clients_admin_manage ON public.clients USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY tech_clients_read_assigned ON public.clients FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE ((j.client_id = clients.id) AND (j.assigned_tech_id = auth.uid()) AND (j.account_id = clients.account_id)))));



CREATE POLICY tech_jobs_admin_manage ON public.jobs USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY tech_jobs_read_assigned ON public.jobs FOR SELECT USING (((assigned_tech_id = auth.uid()) AND (account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = 'TECH'::text) AND (account_memberships.is_active = true))))));



CREATE POLICY tech_jobs_update_assigned ON public.jobs FOR UPDATE USING (((assigned_tech_id = auth.uid()) AND (account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = 'TECH'::text) AND (account_memberships.is_active = true)))))) WITH CHECK (((assigned_tech_id = auth.uid()) AND (account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = 'TECH'::text) AND (account_memberships.is_active = true))))));



ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.technician_rates ENABLE ROW LEVEL SECURITY;


CREATE POLICY "techs manage technician_locations" ON public.technician_locations USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY "techs manage time_approvals" ON public.time_approvals USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true)))));



CREATE POLICY "techs manage time_breaks" ON public.time_breaks USING ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true))))) WITH CHECK ((account_id IN ( SELECT account_memberships.account_id
   FROM public.account_memberships
  WHERE ((account_memberships.user_id = auth.uid()) AND (account_memberships.role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'TECH'::text])) AND (account_memberships.is_active = true)))));



ALTER TABLE public.time_approvals ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.time_breaks ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;


\unrestrict mLzRVZHDfviWYKsyCxGt8QMuQGV3VrZybnxjh1ZWwC8swenqK0yladukmKxg8ok

