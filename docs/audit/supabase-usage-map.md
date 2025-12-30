# Supabase Usage Map

## Tables Used

### accounts

- Reads: app/(auth)/auth/change-password/page.tsx:115, app/(auth)/auth/login/page.tsx:50, app/api/admin/accounts/[accountId]/permissions/route.ts:24, etc.
- Writes: None apparent

### account_memberships

- Reads: app/(auth)/auth/login/page.tsx:50, app/api/admin/audit-logs/route.ts:29, app/api/admin/profile-change-requests/route.ts:17, etc.
- Writes: app/api/admin/users/route.ts:94

### audit_logs

- Reads: app/api/admin/audit-logs/route.ts:49, app/api/admin/audit-logs/route.ts:134
- Writes: app/api/admin/audit-logs/route.ts:134

### business_settings

- Reads: app/api/admin/automations/route.ts:54, app/api/admin/automations/route.ts:130
- Writes: app/api/admin/automations/route.ts:149

### clients

- Reads: app/api/admin/analytics/customers/[id]/route.ts:38, app/api/admin/clients/bulk/route.ts:37, app/api/dashboard/stats/route.ts:43, etc.
- Writes: app/api/admin/clients/bulk/route.ts:137, app/api/clients/route.ts

### contact_requests

- Reads: None
- Writes: app/api/portal/contact/route.ts:49, app/api/portal/emergency/route.ts:61

### conversations

- Reads: app/api/inbox/conversations/[id]/status/route.ts:34, app/api/inbox/conversations/route.ts:42, etc.
- Writes: None

### customer_communications

- Reads: app/api/admin/customer-communications/[id]/route.ts:46, app/api/admin/customer-communications/route.ts:59
- Writes: app/api/admin/customer-communications/route.ts:150

### customers

- Reads: app/api/admin/portal-customers/[id]/invite/route.ts:37, app/api/admin/portal-customers/route.ts:32
- Writes: app/api/admin/portal-customers/route.ts:106

### email_templates

- Reads: app/api/admin/email-templates/[id]/route.ts:44, app/api/admin/email-templates/route.ts:40
- Writes: app/api/admin/email-templates/route.ts:118

### employee_profiles

- Reads: app/api/admin/profile-change-requests/route.ts:143, app/api/employee/profile/route.ts:38
- Writes: app/api/admin/profile-change-requests/route.ts:161, app/api/employee/profile/route.ts:109

### estimates

- Reads: app/api/admin/kpi/route.ts:57, app/api/estimates/route.ts:30, etc.
- Writes: app/api/estimates/route.ts:122

### gmail_connections

- Reads: app/api/auth/google/callback/route.ts:97, app/api/gmail/connections/[id]/route.ts:23
- Writes: app/api/gmail/connections/route.ts:19

### invoice_reminders

- Reads: app/api/admin/invoice-reminders/[id]/route.ts:21, app/api/admin/invoice-reminders/route.ts:23
- Writes: app/api/admin/invoice-reminders/route.ts:112

### invoices

- Reads: app/api/admin/kpi/route.ts:45, app/api/invoices/route.ts:20, etc.
- Writes: app/api/invoices/[id]/send/route.ts:143

### job_checklist_items

- Reads: app/api/tech/jobs/[id]/checklist/route.ts:23, app/api/tech/jobs/[id]/checklist/[itemId]/route.ts:23
- Writes: app/api/tech/jobs/[id]/checklist/route.ts:80

### job_notes

- Reads: app/api/jobs/[id]/notes/route.ts:33, app/api/tech/jobs/[id]/notes/route.ts:23
- Writes: app/api/jobs/[id]/notes/route.ts:85, app/api/tech/jobs/[id]/notes/route.ts:75

### job_photos

- Reads: app/api/jobs/[id]/photos/route.ts:33, app/api/jobs/[id]/photos/route.ts:75
- Writes: app/api/jobs/[id]/photos/route.ts:75

### job_templates

- Reads: app/api/admin/job-templates/[id]/route.ts:53, app/api/admin/job-templates/route.ts:53
- Writes: app/api/admin/job-templates/route.ts:131

### job_workflows

- Reads: app/api/admin/job-workflows/[id]/route.ts:47, app/api/admin/job-workflows/route.ts:48
- Writes: app/api/admin/job-workflows/route.ts:121

### jobs

- Reads: app/api/admin/kpi/route.ts:22, app/api/jobs/[id]/notes/route.ts:21, etc.
- Writes: app/api/jobs/route.ts, app/api/admin/jobs/route.ts

### leads

- Reads: app/api/admin/kpi/route.ts:63, app/api/leads/route.ts:32, etc.
- Writes: app/api/leads/route.ts:209

### materials

- Reads: app/api/admin/materials/[materialId]/ai-recognize/route.ts:44
- Writes: None

### messages

- Reads: app/api/inbox/conversations/route.ts:114, app/api/inbox/messages/[messageId]/attachments/[attachmentIndex]/route.ts:33
- Writes: None

### payments

- Reads: app/api/admin/analytics/customers/[id]/route.ts:83, app/api/jobs/[id]/payments/route.ts:21
- Writes: app/api/jobs/[id]/payments/route.ts:86

### profile_change_requests

- Reads: app/api/admin/profile-change-requests/route.ts:35, app/api/employee/profile/route.ts:134
- Writes: app/api/admin/profile-change-requests/route.ts:121, app/api/employee/profile/route.ts:294

### properties

- Reads: app/api/dashboard/stats/route.ts:44
- Writes: None

### security_settings

- Reads: app/api/admin/security-settings/route.ts:138, app/api/admin/security-settings/route.ts:201
- Writes: app/api/admin/security-settings/route.ts:210

### square_connections

- Reads: app/api/square/oauth/callback/route.ts:31
- Writes: None

### team_assignments

- Reads: app/api/admin/team/assignments/[id]/route.ts:48, app/api/admin/team/assignments/route.ts:35
- Writes: app/api/admin/team/assignments/route.ts:106

### team_availability

- Reads: app/api/admin/team/availability/[id]/route.ts:31, app/api/admin/team/availability/route.ts:26
- Writes: app/api/admin/team/availability/route.ts:84

### team_schedules

- Reads: app/api/admin/team/schedules/[id]/route.ts:45, app/api/admin/team/schedules/route.ts:48
- Writes: app/api/admin/team/schedules/route.ts:116

### users

- Reads: app/(auth)/auth/login/page.tsx:72, app/api/auth/password-changed/route.ts:38, etc.
- Writes: app/api/admin/users/route.ts:66

### visits

- Reads: app/api/tech/schedule/route.ts:33, app/api/tech/visits/[id]/route.ts:35
- Writes: app/api/tech/visits/[id]/route.ts:76

## RPC Calls

### generate_job_number

- lib/db/jobs.ts:110

### get_tool_recognition_stats

- lib/db/ai-tool-recognition.ts:309

### get_tool_utilization_stats

- lib/db/materials.ts:791

### increment_template_usage

- app/api/admin/job-templates/[id]/use/route.ts:24

### get_low_inventory_count

- app/api/sidebar/notifications/route.ts:46

## API Routes List

(Full list from find command, truncated for brevity)

- app/api/portal/invoices/[id]/pay/route.ts
- app/api/portal/invoices/route.ts
- ... (all routes listed)
