# MVP Spine Smoke Test Guide

## Setup

1. Set environment variables:
   ```
   NEXT_PUBLIC_FEATURE_MVP_SPINE=true
   NEXT_PUBLIC_FEATURE_INBOX=false
   NEXT_PUBLIC_FEATURE_ESTIMATES=false
   NEXT_PUBLIC_FEATURE_INVOICES=false
   NEXT_PUBLIC_FEATURE_INVENTORY=false
   NEXT_PUBLIC_FEATURE_CUSTOMER_PORTAL=false
   NEXT_PUBLIC_FEATURE_ANALYTICS=false
   ```
2. Install dependencies: `npm ci`
3. Build: `npm run build`
4. Start dev server: `npm run dev`

## Smoke Test Steps

### Admin Flow

1. Login as admin user
2. Navigate to `/admin/clients`
3. Create a new client with name, phone, email (account_id is auto-set from logged-in admin's account)
4. Call GET /api/clients and verify the new client is returned in the list
5. Click on the client to view details
6. Add a property with address fields
7. Navigate to `/admin/jobs`
8. Create a new job linked to the client/property with title, description, scheduled date (job_number auto-generated, status defaults to 'scheduled', client_id required)
9. Attempt creating job without client - should return 400 error "client_id is required. Select a client before creating a job."
10. Click on the job to view details
11. Assign a technician using the dropdown
12. Verify the assigned tech can see the job

### Tech Flow

1. Login as the assigned tech user
2. Navigate to `/tech/today`
3. Verify the job appears in today's list
4. Click on the job to open details
5. Update status from "scheduled" to "in_progress"
6. Add a note in the notes section
7. Switch back to admin
8. Verify the updated status and new note are visible

## Notes

- Tech status updates use RPC function for security
- RLS policies enforce org + role access
- No direct job status updates from tech UI
- clients = CRM records (public.clients); customers = portal users (non-MVP)
