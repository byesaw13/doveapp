# Schema Drift Report

## Data Sources

- Expected tables: parsed from `supabase/migrations/*.sql`.
- Actual tables: parsed from `supabase/schema_baseline.sql`.

## Expected Tables (from migrations)

- Count: 56

```
public.account_memberships
public.accounts
public.ai_estimate_settings
public.audit_logs
public.automation_history
public.automations
public.business_settings
public.channel_accounts
public.client_activities
public.clients
public.contact_requests
public.conversations
public.customer_communications
public.customers
public.email_templates
public.employee_profiles
public.gmail_connections
public.invoice_line_items
public.invoice_payments
public.invoice_reminders
public.invoices
public.job_checklist_items
public.job_line_items
public.job_materials
public.job_notes
public.job_templates
public.job_tools
public.job_workflow_executions
public.job_workflows
public.jobs
public.lead_activities
public.leads
public.material_transactions
public.materials
public.messages
public.payments
public.profile_change_requests
public.properties
public.security_settings
public.square_connections
public.team_assignments
public.team_availability
public.team_schedules
public.technician_locations
public.technician_rates
public.time_approvals
public.time_breaks
public.time_entries
public.tool_assignments
public.tool_images
public.tool_inventory_counts
public.tool_maintenance
public.tool_recognition_matches
public.tool_recognition_results
public.users
public.visits
```

## Actual Tables (from schema_baseline.sql)

- Count: 59

```
public.account_memberships
public.accounts
public.activity_log
public.ai_estimate_settings
public.alerts
public.audit_logs
public.automation_history
public.automations
public.billing_events
public.business_settings
public.channel_accounts
public.client_activities
public.clients
public.conversations
public.customer_communications
public.customers
public.email_insights
public.email_lead_details
public.email_templates
public.emails_raw
public.employee_profiles
public.estimate_templates
public.estimates
public.gmail_connections
public.invoice_line_items
public.invoice_payments
public.invoices
public.job_line_items
public.job_materials
public.job_notes
public.job_photos
public.job_templates
public.job_tools
public.job_workflow_executions
public.job_workflows
public.jobs
public.lead_activities
public.leads
public.material_transactions
public.materials
public.messages
public.payments
public.profile_change_requests
public.properties
public.security_settings
public.square_connections
public.technician_locations
public.technician_rates
public.time_approvals
public.time_breaks
public.time_entries
public.tool_assignments
public.tool_images
public.tool_inventory_counts
public.tool_maintenance
public.tool_recognition_matches
public.tool_recognition_results
public.users
public.visits
```

## Missing in DB (expected but not found)

- public.contact_requests
- public.invoice_reminders
- public.job_checklist_items
- public.team_assignments
- public.team_availability
- public.team_schedules

## Unexpected in DB (found but not in migrations)

- public.activity_log
- public.alerts
- public.billing_events
- public.email_insights
- public.email_lead_details
- public.emails_raw
- public.estimate_templates
- public.estimates
- public.job_photos

## Notes

- Review any missing or unexpected tables before treating migrations as authoritative.
