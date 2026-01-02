# Table Ownership

This document is generated from the live schema baseline (`supabase/schema_baseline.sql`)
with migrations used to flag drift (missing/extra tables).

Write Mode definitions:

- CRUD: create/update/delete allowed
- Append-only: inserts allowed; updates discouraged
- Draft-only: mutable until finalization
- Events-only: immutable event stream
- Workflow: state transitions governed by approvals
- Event Log: audit/telemetry with controlled writers

| Table                             | Purpose | Canonical Owner | Primary Producer          | Canonical State? | Allowed Writers | Write Mode  | Notes                                                                 |
| --------------------------------- | ------- | --------------- | ------------------------- | ---------------- | --------------- | ----------- | --------------------------------------------------------------------- |
| `public.account_memberships`      | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.accounts`                 | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.activity_log`             | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.ai_estimate_settings`     | TBD     | TBD             | TBD                       | TBD              | TBD             | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.alerts`                   | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.audit_logs`               | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.automation_history`       | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.automations`              | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.billing_events`           | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.business_settings`        | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.channel_accounts`         | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.client_activities`        | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.clients`                  | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.conversations`            | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.customer_communications`  | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.customers`                | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.email_insights`           | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.email_lead_details`       | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.email_templates`          | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.emails_raw`               | TBD     | Event Log       | Automation Workers / Tech | TBD              | service_role    | Event Log   | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.employee_profiles`        | TBD     | TBD             | TBD                       | TBD              | TBD             | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.estimate_templates`       | TBD     | TBD             | TBD                       | TBD              | TBD             | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.estimates`                | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.gmail_connections`        | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.invoice_line_items`       | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.invoice_payments`         | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.invoices`                 | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_line_items`           | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_materials`            | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_notes`                | TBD     | TBD             | AI App + Humans           | TBD              | authenticated   | Append-only | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_photos`               | TBD     | TBD             | TBD                       | TBD              | TBD             | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_templates`            | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_tools`                | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_workflow_executions`  | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.job_workflows`            | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.jobs`                     | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.lead_activities`          | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.leads`                    | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.material_transactions`    | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.materials`                | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.messages`                 | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.payments`                 | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.profile_change_requests`  | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.properties`               | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.security_settings`        | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.square_connections`       | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.technician_locations`     | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.technician_rates`         | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.time_approvals`           | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.time_breaks`              | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.time_entries`             | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_assignments`         | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_images`              | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_inventory_counts`    | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_maintenance`         | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_recognition_matches` | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.tool_recognition_results` | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.users`                    | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.visits`                   | TBD     | Doveapp Core    | Doveapp Core              | TBD              | authenticated   | CRUD        | Present in DB (see SCHEMA_DRIFT_REPORT.md)                            |
| `public.contact_requests`         | TBD     | TBD             | TBD                       | TBD              | TBD             | CRUD        | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
| `public.invoice_reminders`        | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
| `public.job_checklist_items`      | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
| `public.team_assignments`         | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
| `public.team_availability`        | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
| `public.team_schedules`           | TBD     | Workflow        | Doveapp Core              | TBD              | authenticated   | Workflow    | Expected by migrations but missing in DB (see SCHEMA_DRIFT_REPORT.md) |
