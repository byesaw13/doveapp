# DoveApp - Complete Field Service Management System

A comprehensive Next.js + Supabase application for managing handyman and painting services, inspired by Jobber. Built for solo contractors who need client management, job tracking, invoicing, lead management, and AI-powered automations with local data backup.

## 🚀 Features Overview

### ✅ Core Modules (All Implemented)

#### 1. **Client Management**

- Full CRUD operations for clients
- Search and filter by name, email, or company
- Import customers from Square API
- Client activity tracking and notes
- Mobile-responsive interface

#### 2. **Job Management**

- Create and manage jobs with line items (labor + materials)
- Job status workflow: Draft → Quote → Scheduled → In Progress → Completed → Invoiced
- Auto-calculated totals and job numbering
- Link jobs to clients and estimates
- Job templates and time tracking

#### 3. **Payment Tracking**

- Record payments against jobs
- Payment status: Unpaid, Partial, Paid
- Multiple payment methods (cash, check, card, etc.)
- Payment history and balance tracking
- Auto-updates job payment status

#### 4. **Estimates & Quotes**

- AI-powered estimate generation with vision analysis
- Historical pricing learning from past jobs
- Estimate lifecycle: Draft → Sent → Approved → Declined
- Convert approved estimates to jobs
- PDF estimate generation

#### 5. **Invoice Management**

- Create invoices from completed jobs
- Invoice status tracking: Draft → Sent → Partial → Paid
- Invoice line items and payment recording
- PDF invoice generation
- Invoice follow-up automations

#### 6. **Lead Management**

- Lead inbox with urgency scoring
- Lead qualification and conversion tracking
- Source analytics and performance metrics
- Mobile quick-add widget with voice input

#### 7. **AI Automations**

- Estimate follow-up reminders (48 hours after sending)
- Invoice follow-up escalations (3, 7, 14, 30 days)
- Job closeout summaries and safety tips
- Review request messages
- Configurable automation settings

#### 8. **Additional Features**

- Time tracking with start/stop timers
- Photo uploads for jobs and properties
- Calendar view with job scheduling
- KPI dashboard with business metrics
- PWA with offline capabilities
- Data backup and restore (JSON export/import)
- Mobile-responsive design throughout

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available)

### 1. Clone and Install

```bash
git clone <repository-url>
cd doveapp
npm install
```

### 2. Set Up Supabase Database

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Click "New Project"
   - Choose name, password, and region
   - Wait for provisioning (~2 minutes)

2. **Get Credentials:**
   - In Supabase dashboard → Settings → API
   - Copy `Project URL` and `anon public` key

3. **Run All Migrations:**
   - Go to Supabase → SQL Editor
   - Run each migration file in order:
     ```sql
     -- Run these in Supabase SQL Editor:
     supabase/migrations/001_create_clients_table.sql
     supabase/migrations/002_create_square_connections_table.sql
     supabase/migrations/003_create_jobs_table.sql
     supabase/migrations/004_create_payments_table.sql
     supabase/migrations/005_create_properties_table.sql
     supabase/migrations/006_migrate_client_addresses_to_properties.sql
     supabase/migrations/007_add_client_preferences.sql
     supabase/migrations/008_create_job_photos_table.sql
     supabase/migrations/009_create_materials_table.sql
     supabase/migrations/010_create_tool_tracking.sql
     supabase/migrations/011_create_ai_tool_recognition.sql
     supabase/migrations/012_create_time_tracking.sql
      supabase/migrations/013_create_job_templates.sql
      supabase/migrations/020_create_leads_table.sql
      supabase/migrations/021_create_estimates_table.sql
      supabase/migrations/024_create_client_activities.sql
     supabase/migrations/025_ensure_estimates_leads_relationship.sql
     supabase/migrations/026_fix_email_insights_column_name.sql
     supabase/migrations/027_create_ai_estimate_settings.sql
     supabase/migrations/028_create_business_settings.sql
     supabase/migrations/029_phase2_estimate_lifecycle.sql
     supabase/migrations/030_phase3_jobs.sql
     supabase/migrations/031_phase4_invoices.sql
     supabase/migrations/032_phase5_automations.sql
     ```

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (Required for AI features)
OPENAI_API_KEY=your-openai-api-key

# Square API (Optional - for customer import)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your-square-token

# Email Integration (Optional)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## 📱 Usage Guide

### Navigation

- **Dashboard**: Overview with KPIs and recent activity
- **Clients**: Manage customer database
- **Jobs**: Create and track service jobs
- **Estimates**: Generate and manage quotes
- **Invoices**: Handle billing and payments
- **Leads**: Lead inbox and qualification
- **Calendar**: Schedule view
- **Time Tracking**: Log work hours
- **Settings**: Configure business settings and automations

### Quick Start Workflow

1. **Add Clients**: Import from Square or add manually
2. **Create Estimates**: Use AI to generate quotes from photos/descriptions
3. **Convert to Jobs**: Turn approved estimates into scheduled work
4. **Track Progress**: Update job status through completion
5. **Send Invoices**: Generate invoices from completed jobs
6. **Record Payments**: Track payments and balances
7. **Automations**: Set up AI follow-ups and reminders

### Mobile Features

- **Quick Add Lead**: Blue + button for fast lead capture
- **Voice Input**: Microphone icon for hands-free data entry
- **Swipe Navigation**: Swipe from left for sidebar
- **Call/Text/Email**: Direct contact buttons on leads
- **PWA**: Install as app for offline access

## ⚙️ Configuration

### Business Settings

- Company information and branding
- Default tax rates and terms
- Estimate validity periods
- Payment terms

### AI Automations

Configure which automations run automatically:

- Estimate follow-ups (48 hours)
- Invoice reminders (3, 7, 14, 30 days)
- Job closeout summaries
- Review requests
- Lead auto-responses

### AI Estimate Settings

- Service-specific pricing
- Material markup percentages
- Labor rates and overtime
- Profit margins and overhead

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Production server

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix linting
npm run format          # Prettier format
npm run type-check      # TypeScript check

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode tests

# Database
# Run migrations in Supabase SQL Editor (see setup above)
```

## 🐛 Troubleshooting

### Common Issues

**"Failed to load [module]" Error:**

- Check Supabase URL and keys in `.env.local`
- Verify all migrations have been run
- Check browser console for detailed errors

**AI Features Not Working:**

- Verify `OPENAI_API_KEY` is set
- Check API quota and billing

**Square Import Issues:**

- Confirm `SQUARE_ACCESS_TOKEN` is valid
- Use sandbox environment for testing

**Build Errors:**

```bash
npm run type-check    # Check TypeScript
npm run lint         # Check linting
rm -rf .next         # Clear cache
npm run build        # Rebuild
```

**Database Connection:**

- Check Supabase project is active
- Verify anon key permissions
- Review Supabase logs in dashboard

### Data Backup

- Go to Settings → Data Management
- Click "Download Backup" to export all data
- Use "Import Backup" to restore from file
- Backups include all tables and relationships

## 📊 Business Intelligence

### KPI Dashboard

- Revenue tracking and projections
- Job completion rates
- Estimate conversion metrics
- Lead source performance
- Time tracking analytics

### Lead Analytics

- Conversion rates by source
- Average deal values
- Time to conversion
- ROI analysis per marketing channel

### Email Intelligence

- Automatic categorization (leads, billing, junk)
- Priority scoring
- Action item extraction
- Response suggestions

## 🏗️ Project Structure

```
doveapp/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── clients/                  # Client management
│   ├── jobs/                     # Job tracking
│   ├── estimates/                # Quote generation
│   ├── invoices/                 # Billing
│   ├── leads/                    # Lead management
│   ├── settings/                 # Configuration
│   └── automations/              # Automation dashboard
├── lib/                          # Business logic
│   ├── ai/                       # AI integrations
│   ├── db/                       # Database operations
│   ├── validations/              # Form schemas
│   └── backup.ts                 # Data export/import
├── types/                        # TypeScript definitions
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── PWA/                      # Progressive Web App
├── supabase/migrations/          # Database schema
└── public/                       # Static assets
```

## 🔒 Security & Privacy

- All data stored securely in Supabase
- Client-side encryption for sensitive data
- Row-level security policies
- API key protection
- No data sent to third parties without consent

## 📈 Performance

- Optimized database queries with indexes
- Lazy loading for large datasets
- PWA caching for offline access
- Mobile-first responsive design
- Fast TypeScript compilation

## 🤝 Contributing

This is a private project. For development guidelines, see `AGENTS.md`.

## 📄 License

Private project - All rights reserved.

---

**Status: ✅ FULLY IMPLEMENTED AND PRODUCTION READY**

DoveApp provides a complete field service management solution with modern AI capabilities, mobile optimization, and comprehensive automation features.
