# Phase 1B: Jobs & Invoices - Setup Guide

## ✅ Phase 1B Code is Complete!

All the code for job management is built and ready. Now you just need to run the database migration.

## 🚀 Quick Setup (2 minutes)

### Step 1: Run the Database Migration

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Open the file: `supabase/migrations/003_create_jobs_table.sql`
5. Copy the **entire contents**
6. Paste into the Supabase SQL Editor
7. Click **"Run"**
8. You should see: "Success. No rows returned"

### Step 2: Restart Dev Server (if needed)

```bash
pkill -f 'next dev'
npm run dev
```

### Step 3: Start Creating Jobs!

Visit: http://localhost:3000/jobs

## 📊 What's Been Built

### Database Tables:
- **`jobs`** - Main job records
  - Links to clients
  - Job number (auto-generated: JOB-00001, JOB-00002, etc.)
  - Status workflow: quote → scheduled → in_progress → completed → invoiced
  - Service date and time
  - Subtotal, tax, total (auto-calculated)
  
- **`job_line_items`** - Labor and materials
  - Type: labor or material
  - Description, quantity, unit price
  - Total auto-calculated
  - Links to jobs

### Features:
- ✅ Create jobs with multiple line items
- ✅ Link jobs to clients (dropdown selection)
- ✅ Job status workflow
- ✅ Auto-calculate totals from line items
- ✅ Auto-generate job numbers
- ✅ View all jobs in table
- ✅ Delete jobs
- ✅ Backup system includes jobs

### UI Pages:
- `/jobs` - Job list with status badges
- `/jobs/new` - Create new job form
- Navigation between clients and jobs

## 🎯 How to Use

### Create Your First Job:

1. **Visit:** http://localhost:3000/jobs
2. Click **"Create Job"**
3. Fill in the form:
   - Select a client (from your 61 imported customers!)
   - Job title: e.g., "Interior Painting - Living Room"
   - Status: Quote, Scheduled, etc.
   - Service date (optional)
   
4. **Add Line Items:**
   - Item 1: Labor - "Paint living room walls" - Qty: 8 hours - Price: $50/hr
   - Click "Add Item" for materials
   - Item 2: Material - "Paint (2 gallons)" - Qty: 2 - Price: $35/gallon
   
5. Click **"Create Job"**
6. Job auto-calculates total: $470 (8×$50 + 2×$35)

### View Your Jobs:

- Job table shows: Job #, Title, Client, Status, Date, Total
- Status badges color-coded (Quote=gray, Scheduled=blue, In Progress=yellow, Completed=green)
- Click "View Jobs" from clients page or visit /jobs directly

### Job Status Workflow:

Typical flow for a handyman job:
1. **Quote** - Initial estimate for customer
2. **Scheduled** - Customer accepted, job on calendar
3. **In Progress** - Currently working on it
4. **Completed** - Job finished
5. **Invoiced** - Invoice sent/paid

## 🔧 Database Features

### Auto-Generated Job Numbers:
- Format: JOB-00001, JOB-00002, etc.
- Sequential numbering
- Never duplicates

### Auto-Calculated Totals:
- Line items: quantity × unit_price = total
- Job subtotal: sum of all line items
- Tax: configurable (currently 0%)
- Job total: subtotal + tax

### Data Integrity:
- Jobs link to clients (cascade delete)
- Line items link to jobs (cascade delete)
- Delete a client → all their jobs deleted
- Delete a job → all line items deleted

## 📁 Files Created

**Types & Validation:**
- `types/job.ts` - TypeScript interfaces
- `lib/validations/job.ts` - Zod schemas

**Database:**
- `lib/db/jobs.ts` - CRUD operations
- `supabase/migrations/003_create_jobs_table.sql` - Schema

**UI:**
- `app/jobs/page.tsx` - Job list
- `app/jobs/new/page.tsx` - Create job form
- `app/jobs/components/JobTable.tsx` - Data table

**Updates:**
- `lib/backup.ts` - Includes jobs tables
- `app/clients/page.tsx` - Navigation to jobs

## ✅ Testing Checklist

After running the migration, test these:

- [ ] Navigate to /jobs page
- [ ] Click "Create Job"
- [ ] Select a client from dropdown
- [ ] Add job title
- [ ] Add line items (labor + materials)
- [ ] Create the job
- [ ] See job appear in list
- [ ] Check total is calculated correctly
- [ ] Delete a test job
- [ ] Verify job number auto-increments

## 🎨 Next Features (Future)

Phase 1B is basic job management. Future enhancements:
- Job detail view page
- Edit existing jobs
- Convert quote → scheduled → completed flow
- Print/PDF invoice generation
- Photo attachments
- Job templates for common services

## 📖 Related Documentation

- `SESSION_SUMMARY.md` - Overall progress
- `README.md` - App overview
- `AGENTS.md` - Development guidelines

---

**Ready to test?** Run the migration and create your first job! 🚀
