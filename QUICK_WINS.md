# Quick Wins - High Impact, Low Effort Features

These 7 features can each be completed in 1-2 days and provide immediate value to DoveApp users.

---

## 1. Tech Job Notes ⭐

**Effort:** 1 day  
**Impact:** High - Improves technician workflow  
**Location:** `app/tech/jobs/[id]/page.tsx:275`

### Current State

Placeholder comment: `{/* TODO: Add notes functionality */}`

### Requirements

- Add/edit/delete job notes from tech portal
- Timestamp and author (tech name) for each note
- Display notes in reverse chronological order
- Make notes visible to admin in job detail
- Optional: Photo attachments

### Implementation Steps

1. Add notes section to tech job detail page
2. Create note form component with textarea
3. Save notes to `job_notes` table or JSON field in jobs
4. Display note list below form
5. Add delete functionality for own notes

---

## 2. Outstanding Balance Check ⭐

**Effort:** 1-2 days  
**Impact:** High - Critical for collections  
**Location:** `app/admin/clients/page.tsx:572`

### Current State

Function returns `false`: `return false; // TODO: Implement outstanding balance check`

### Requirements

- Calculate total unpaid amount per client
- Show outstanding balance in client list
- Color-code by severity (red >90 days, yellow >30 days)
- Filter clients by outstanding balance
- Link to unpaid invoices

### Implementation Steps

1. Query invoices for each client where `status != 'paid'`
2. Sum `balance_due` for all unpaid invoices
3. Add balance to client list display
4. Add filter for "Has outstanding balance"
5. Color-code based on oldest invoice date

---

## 3. Activity Logging for Estimates ⭐

**Effort:** 1 day  
**Impact:** Medium - Better audit trail  
**Location:** `app/api/estimates/[id]/send/route.ts:158`

### Current State

Comment: `// TODO: Implement activity logging`

### Requirements

- Log when estimate is sent
- Log when estimate is viewed (customer opens link)
- Log status changes (approved, declined, expired)
- Show activity timeline in estimate detail
- Track who made changes (user_id)

### Implementation Steps

1. Insert activity records into `client_activities` table
2. Activity types: 'estimate_sent', 'estimate_viewed', 'estimate_approved', etc.
3. Display activity timeline in estimate detail page
4. Add webhook/callback for "viewed" tracking
5. Include activity in estimate history

---

## 4. Proper Logout ⭐

**Effort:** 1 day  
**Impact:** Medium - Security best practice  
**Location:** `components/sidebar.tsx:567`

### Current State

Comment: `{/* Logout Button - TODO: Implement proper logout */}`

### Requirements

- Sign out from Supabase auth
- Clear localStorage/sessionStorage
- Clear any cached data
- Redirect to login page
- Broadcast logout to other tabs (if multi-tab support)

### Implementation Steps

1. Call `supabase.auth.signOut()`
2. Clear any app-specific storage
3. Use `router.push('/auth/login')`
4. Optionally: Add logout confirmation dialog
5. Handle logout errors gracefully

---

## 5. Job Automation Suggestions UI ⭐

**Effort:** 1-2 days  
**Impact:** Medium - Showcases AI capabilities  
**Location:** `lib/job-automation.ts:363`

### Current State

Function `getJobAutomationSuggestions` exists but is never called

### Requirements

- Display automation suggestions in job detail page
- Suggestion types: status changes, invoice creation, schedule updates
- "Apply" button to execute suggestion
- "Dismiss" button to ignore
- Learn from user actions (track applied vs dismissed)

### Implementation Steps

1. Call `getJobAutomationSuggestions(job)` in job detail page
2. Create suggestions card component
3. Display each suggestion with description and action button
4. Wire "Apply" button to execute automation
5. Track suggestion effectiveness (applied/dismissed ratio)

---

## 6. Check for Existing Invoice ⭐

**Effort:** 1 day  
**Impact:** Medium - Prevents duplicates  
**Location:** `app/api/jobs/[id]/invoice/route.ts:24`

### Current State

Comment: `// TODO: Check if invoice exists for this job`

### Requirements

- Query invoices table for job_id
- If invoice exists, return existing invoice ID
- Prevent duplicate invoice creation
- Link to existing invoice if found
- Allow force-create override for special cases

### Implementation Steps

1. Add query before creating invoice: `SELECT id FROM invoices WHERE job_id = ?`
2. If found, return `{ exists: true, invoice_id: existingId }`
3. Update frontend to handle existing invoice case
4. Show link to existing invoice with message
5. Add "Create anyway" option for edge cases

---

## 7. Change Request Email Notification ⭐

**Effort:** 1 day  
**Impact:** Medium - Better communication  
**Location:** `app/api/estimates/[id]/request-changes/route.ts:50`

### Current State

Comment: `// TODO: Send email notification to business about change request`

### Requirements

- Send email to business owner when customer requests changes
- Include customer's requested changes text
- Link to estimate in admin panel
- Mark as "pending changes" in estimate list
- Track response time

### Implementation Steps

1. Create email template for change requests
2. Use Resend API to send notification email
3. Include: customer name, estimate number, requested changes
4. Add "View Estimate" link to admin panel
5. Update estimate status to 'pending_changes'

---

## Implementation Priority

### Week 1

1. Proper Logout (Day 1)
2. Tech Job Notes (Day 2)
3. Check for Existing Invoice (Day 3)
4. Activity Logging for Estimates (Day 4)
5. Change Request Email (Day 5)

### Week 2

6. Outstanding Balance Check (Days 1-2)
7. Job Automation Suggestions UI (Days 3-4)
8. Testing and polish (Day 5)

**Total Time:** 8-10 days  
**Impact:** Significantly improved user experience and functionality

---

## Success Metrics

After implementing these quick wins:

- ✅ Technicians can add notes to jobs (better communication)
- ✅ Admin can see client balances at a glance (better collections)
- ✅ All estimate actions are logged (better audit trail)
- ✅ Users are properly logged out (better security)
- ✅ AI suggestions are visible (showcase AI features)
- ✅ Duplicate invoices are prevented (data integrity)
- ✅ Change requests trigger notifications (faster response)

---

**Next Steps:** Pick any of these features and start implementation. Each can be completed independently without dependencies on other features.
