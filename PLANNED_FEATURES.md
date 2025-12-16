# DoveApp - Planned Components & Features Roadmap

**Generated:** December 16, 2025
**Status:** Post-Quick Wins Assessment - 7/7 quick wins completed ✅

---

## 🎯 Executive Summary

**🏆 QUICK WINS COMPLETED: 7/7 (100%)** 🎉

All high-impact, low-effort features have been successfully implemented. This updated roadmap focuses on the remaining 17 features that will transform DoveApp into a comprehensive, production-ready field service management platform.

### Current Status

- **Tech Portal:** 33% complete (notes done, profile/checklists pending)
- **Customer Portal:** 25% complete (balance check done, contact/emergency pending)
- **Communication:** 29% complete (activity logging done, email/SMS pending)
- **Security:** 0% complete (permissions system pending)

### Strategic Priorities

1. **Complete Tech Experience** - Finish profile management and checklists
2. **Enhance Customer Communication** - Self-service and emergency features
3. **Automate Billing Workflow** - Email/SMS integration and attachments
4. **Leverage AI Capabilities** - Tool recognition and templates
5. **Ensure Production Readiness** - Security, multi-tenancy, and permissions

**Timeline:** 10 weeks (5 sprints) | **Effort:** 45-60 developer days | **Risk Level:** Medium

---

## 📱 1. Tech Portal Features (PRIORITY: HIGH)

### 1.1 Tech Profile Management

**Status:** Stub page exists  
**Location:** `app/tech/profile/page.tsx`  
**Current State:** Placeholder page with hardcoded values  
**TODO:** Implement profile management

**Requirements:**

- Edit technician name, email, phone
- Upload profile photo
- Change password functionality
- Notification preferences
- Availability/schedule settings

**Effort:** Medium (2-3 days)

---

### 1.2 Tech Job Notes

**Status:** Placeholder section  
**Location:** `app/tech/jobs/[id]/page.tsx:275`  
**Current State:** Comment placeholder  
**TODO:** Add notes functionality

**Requirements:**

- Add/edit/delete job notes
- Timestamp and author tracking
- Notes visible to admin
- Rich text or markdown support
- Photo attachments for notes

**Effort:** Small (1 day)

---

### 1.3 Job Checklists

**Status:** Placeholder section  
**Location:** `app/tech/jobs/[id]/page.tsx:288`  
**Current State:** Comment placeholder  
**TODO:** Implement job checklists

**Requirements:**

- Customizable checklist items per job
- Check/uncheck functionality
- Progress tracking
- Template checklists by job type
- Required vs optional items

**Effort:** Medium (2-3 days)

---

## 🔐 2. Authentication & Permissions (PRIORITY: HIGH)

### 2.1 Permissions System

**Status:** Database structure not finalized  
**Location:** `app/api/admin/users/route.ts:88, 195`  
**Current State:** Permission fields commented out  
**TODO:** Store permissions once database column is added

**Requirements:**

- Add permissions column to users/account_memberships table
- Define granular permissions (manage_users, manage_billing, etc.)
- Implement permission checks in auth-guards
- UI for assigning permissions to users
- Role-based permission templates

**Related:** Multiple unused auth guard functions in `lib/auth-guards.ts`:

- `canManageUsers`
- `canManageAccount`
- `canManageBusiness`
- `canManageTeam`
- `canAccessCustomer`

**Effort:** Large (5-7 days)

---

### 2.2 Proper Logout Implementation

**Status:** Placeholder  
**Location:** `components/sidebar.tsx:567`  
**Current State:** Comment says "TODO: Implement proper logout"  
**TODO:** Full logout flow with session cleanup

**Requirements:**

- Clear Supabase session
- Clear local storage
- Redirect to login
- Clear any cached data
- Logout from all tabs (broadcast channel)

**Effort:** Small (1 day)

---

## 📧 3. Email & Communication (PRIORITY: MEDIUM)

### 3.1 Email Sync Worker

**Status:** Partially implemented  
**Location:** `app/api/email/sync/route.ts`, `lib/messaging/gmailWorker.ts`  
**Current State:** Basic structure, needs auth and token refresh  
**TODO:** Add authentication, implement full OAuth token refresh

**Requirements:**

- Add authentication to prevent unauthorized access
- Full OAuth token refresh logic
- Handle expired tokens gracefully
- Schedule periodic sync (cron job)
- Error handling and retry logic

**Effort:** Medium (3-4 days)

---

### 3.2 Gmail Connection Management Page

**Status:** Planned  
**Location:** `app/api/auth/google/callback/route.ts:112`  
**Current State:** Comment mentions future enhancement  
**TODO:** Build dedicated /emails page to manage Gmail connections

**Requirements:**

- List all connected Gmail accounts
- Add/remove connections
- Test connection status
- View sync history
- Configure sync settings (folders, frequency)

**Effort:** Medium (2-3 days)

---

### 3.3 Email Attachment Download

**Status:** Not implemented  
**Location:** `lib/messaging/gmailWorker.ts:303`  
**Current State:** TODO comment  
**TODO:** Implement attachment download for unified inbox

**Requirements:**

- Download and store attachments from emails
- Preview attachments in inbox
- Link attachments to jobs/estimates
- Virus scanning
- Storage management

**Effort:** Medium (2-3 days)

---

## 📄 4. Invoice & Estimate Features (PRIORITY: MEDIUM)

### 4.1 Send Invoice via Email/SMS

**Status:** Placeholder functions  
**Location:** `app/api/estimates/[id]/send/route.ts:112, 117`  
**Current State:** Helper functions are stubs  
**TODO:** Implement email sending (Resend/SendGrid) and SMS sending (Twilio)

**Requirements:**

- Integrate Resend for email
- Integrate Twilio for SMS
- Email templates with branding
- SMS templates with short links
- Delivery tracking and status
- Bounce handling

**Effort:** Medium (3-4 days)

---

### 4.2 Send Invoice Functionality

**Status:** UI exists but not wired up  
**Location:** `app/admin/invoices/[id]/page.tsx:449`  
**Current State:** Button shows "Feature Coming Soon" alert  
**TODO:** Implement send invoice functionality

**Requirements:**

- Generate PDF
- Send via email with PDF attachment
- Optional SMS with payment link
- Track sent status
- Resend capability
- Activity logging

**Effort:** Medium (2-3 days)

---

### 4.3 Activity Logging for Estimates

**Status:** Not implemented  
**Location:** `app/api/estimates/[id]/send/route.ts:158`  
**Current State:** TODO comment  
**TODO:** Implement activity logging

**Requirements:**

- Log estimate sent events
- Log estimate viewed events
- Log status changes
- Show timeline in estimate detail
- Filter by activity type

**Effort:** Small (1 day)

---

### 4.4 Estimate Change Request Email Notifications

**Status:** Not implemented  
**Location:** `app/api/estimates/[id]/request-changes/route.ts:50`  
**Current State:** TODO comment  
**TODO:** Send email notification to business about change request

**Requirements:**

- Email template for change requests
- Include customer comments
- Link to estimate for quick action
- Notification preferences

**Effort:** Small (1 day)

---

## 🏗️ 5. Job & Template Features (PRIORITY: LOW-MEDIUM)

### 5.1 Job Template Creation

**Status:** UI placeholder  
**Location:** `app/admin/jobs/components/JobTemplates.tsx`  
**Current State:** Shows "Template creation feature coming soon..."  
**TODO:** Build job template system

**Requirements:**

- Create templates with default line items
- Categorize templates (residential, commercial, etc.)
- Apply template to new job
- Edit/delete templates
- Duplicate existing jobs as templates

**Effort:** Medium (3-4 days)

---

### 5.2 Check for Existing Invoice Before Creating

**Status:** Logic commented out  
**Location:** `app/api/jobs/[id]/invoice/route.ts:24`  
**Current State:** TODO to check if invoice exists  
**TODO:** Prevent duplicate invoice creation

**Requirements:**

- Check if invoice already exists for job
- Return existing invoice ID if found
- Warn user before creating duplicate
- Link to existing invoice

**Effort:** Small (1 day)

---

## 👥 6. Client & Customer Portal (PRIORITY: MEDIUM)

### 6.1 Property Creation Form

**Status:** Placeholder in modal  
**Location:** `app/admin/clients/components/ClientDetailModal.tsx`  
**Current State:** Shows "Property creation form coming soon..."  
**TODO:** Build property creation UI in client detail modal

**Requirements:**

- Add property form inside modal
- Link property to client
- Set as primary property
- Multiple properties per client
- Property type (residential, commercial)

**Effort:** Small (1-2 days)

---

### 6.2 Customer Portal Emergency Service Request

**Status:** Alert placeholder  
**Location:** `app/(portal)/portal/CustomerPortalSidebar.tsx`  
**Current State:** Shows alert "Emergency service request feature coming soon!"  
**TODO:** Implement emergency service request

**Requirements:**

- Priority request form
- Send immediate notification to admin
- Include location, photos, description
- Estimated response time
- Status tracking

**Effort:** Medium (2-3 days)

---

### 6.3 Customer Portal Contact Us

**Status:** Alert placeholder  
**Location:** `app/(portal)/portal/CustomerPortalSidebar.tsx`  
**Current State:** Shows alert "Contact us feature coming soon!"  
**TODO:** Implement contact form

**Requirements:**

- Contact form with categories
- Send to admin email
- Track conversations
- Response time SLA
- File attachments

**Effort:** Small (1-2 days)

---

### 6.4 Outstanding Balance Check

**Status:** Function returns false  
**Location:** `app/admin/clients/page.tsx:572`  
**Current State:** TODO to implement outstanding balance check  
**TODO:** Calculate and display client outstanding balances

**Requirements:**

- Sum unpaid invoices per client
- Show in client list
- Filter by outstanding balance
- Payment reminders
- Aging reports (30/60/90 days)

**Effort:** Small (1-2 days)

---

## 🤖 7. AI & Automation Features (PRIORITY: MEDIUM)

### 7.1 AI Tool Recognition (Vision Service)

**Status:** Structure exists, AI call stubbed  
**Location:** `lib/db/ai-tool-recognition.ts:112, 341`  
**Current State:** TODO to integrate with actual AI vision service  
**TODO:** Implement actual AI vision service integration

**Requirements:**

- Integrate with OpenAI Vision or similar
- Detect tools in job photos
- Suggest inventory additions
- Link detected tools to inventory
- Confidence scoring

**Effort:** Medium (3-4 days)

---

### 7.2 Job Automation Suggestions

**Status:** Function exists but unused  
**Location:** `lib/job-automation.ts:363`  
**Current State:** `getJobAutomationSuggestions` not called anywhere  
**TODO:** Integrate automation suggestions in UI

**Requirements:**

- Show suggestions in job detail page
- "Auto-apply" button for suggestions
- Suggestion types: status changes, invoice generation, etc.
- Dismiss/ignore suggestions
- Learn from user actions

**Effort:** Small (1-2 days)

---

### 7.3 Auto-Convert Quote to Scheduled

**Status:** Function exists but unused  
**Location:** `lib/job-automation.ts:147`  
**Current State:** `autoConvertQuoteToScheduled` not called  
**TODO:** Wire up automatic quote conversion

**Requirements:**

- Trigger on estimate approval
- Set job to scheduled status
- Create calendar event
- Notify technician
- Update estimate status

**Effort:** Small (1 day)

---

## 📊 8. Multi-Tenant & Account Features (PRIORITY: LOW)

### 8.1 Account ID Filtering

**Status:** Commented out in multiple places  
**Locations:**

- `app/api/kpi/route.ts:48`
- `app/api/dashboard/stats/route.ts:69`
- `lib/api/jobs.ts:76`
- `lib/api/invoices.ts:53, 127`
- `lib/api/estimates.ts:52, 127`

**Current State:** Account ID filtering disabled pending backfill  
**TODO:** Enable after backfill - filter by account_id in multi-tenant queries

**Requirements:**

- Complete account_id backfill for all tables
- Enable account_id filtering in all queries
- Test tenant isolation
- RLS policies for account_id
- Migration plan for existing data

**Effort:** Medium (2-3 days)

---

### 8.2 Customer ID Population

**Status:** Referenced but not used  
**Locations:**

- `app/api/portal/jobs/route.ts:26`
- `lib/api/jobs.ts:86, 183`
- `lib/api/invoices.ts:53, 127`
- `lib/api/estimates.ts:52, 127`

**Current State:** TODO comments for customer_id validation and filtering  
**TODO:** Populate customer_id and use for customer portal filtering

**Requirements:**

- Link customers table to users
- Populate customer_id on jobs, invoices, estimates
- Filter portal views by customer_id
- Update API endpoints for customer access
- Customer-specific permissions

**Effort:** Medium (2-3 days)

---

## 🎨 9. Design System & UI (PRIORITY: LOW)

### 9.1 Design Tokens Integration

**Status:** Entire file unused  
**Location:** `lib/design-tokens.ts`  
**Current State:** Complete design token system defined but never used  
**TODO:** Integrate design tokens throughout app

**Exports:**

- spacing, typography, colors, shadows
- borderRadius, breakpoints, components
- animations, zIndex

**Requirements:**

- Use tokens in Tailwind config
- Replace hardcoded values with tokens
- Create component variants using tokens
- Document design system
- Storybook for components

**Effort:** Large (7-10 days)

---

## 🚀 10. Future Roadmap Features (from AGENTS.md)

These are strategic features planned for Q1-Q3 2025:

### Q1 2025 Priorities

**10.1 Performance Optimization**

- Database query optimization and indexing
- Image compression and lazy loading
- Bundle size reduction
- Caching strategies

**10.2 UX Enhancements**

- Advanced filtering and search
- Bulk operations for jobs/clients
- Keyboard shortcuts expansion
- Dark mode support

**10.3 Mobile App**

- Native mobile apps (React Native/Expo)
- Enhanced offline capabilities
- Push notifications
- GPS tracking for technicians

---

### Q2-Q3 2025 Goals

**10.4 Advanced AI Features**

- Predictive scheduling and resource allocation
- Automated pricing optimization
- Customer sentiment analysis
- Smart lead scoring

**10.5 Integration Ecosystem**

- QuickBooks/Accounting software integration
- Calendar sync (Google Calendar, Outlook)
- SMS gateway integration
- CRM platform connectors

**10.6 Reporting & Analytics**

- Advanced BI dashboard
- Profitability analysis by job type
- Customer lifetime value tracking
- Seasonal trend analysis

---

## 📋 Updated Priority Matrix (Post-Quick Wins)

### ✅ Sprint 1 (Week 1-2): Tech Portal Completion - COMPLETED

**Focus:** Complete technician experience improvements

1. ✅ Tech Profile Management (2-3 days) - Full profile editing with avatar upload
2. ✅ Job Checklists (2-3 days) - Interactive checklist system with progress tracking
3. ✅ Auto-Convert Quote to Scheduled (1 day) - Automatic job conversion on estimate approval

### Sprint 2 (Week 3-4): Communication & Customer Portal

**Focus:** Enhance customer communication and self-service

1. 🟡 Customer Portal Contact Us (1-2 days) - Improve customer support
2. 🟡 Customer Portal Emergency Service (2-3 days) - Critical for urgent requests
3. 🟡 Property Creation Form (1-2 days) - Streamline client management

### Sprint 3 (Week 5-6): Invoice & Email Systems

**Focus:** Complete billing workflow and communication

1. 🟡 Send Invoice Functionality (2-3 days) - Essential billing feature
2. 🟡 Send Invoice via Email/SMS (3-4 days) - Complete communication workflow
3. 🟢 Email Attachment Download (2-3 days) - Enhance inbox functionality

### Sprint 4 (Week 7-8): Automation & AI

**Focus:** Leverage AI capabilities for operational efficiency

1. 🟡 AI Tool Recognition (3-4 days) - Inventory management automation
2. 🟡 Job Template Creation (3-4 days) - Streamline job creation
3. 🟢 Gmail Connection Management (2-3 days) - Complete email integration

### Sprint 5 (Week 9-10): Multi-Tenant & Security

**Focus:** Production readiness and security

1. 🟡 Permissions System (5-7 days) - Critical for business security
2. 🟡 Account ID Filtering (2-3 days) - Multi-tenant data isolation
3. 🟡 Customer ID Population (2-3 days) - Customer portal security

### Future Sprints (Month 3-4): Advanced Features

**Focus:** Strategic enhancements and polish

1. 🟢 Email Sync Worker (3-4 days) - Complete email automation
2. ✅ Design Tokens Integration (7-10 days) - UI consistency - COMPLETED
3. 🟢 Native Mobile App (Ongoing) - Mobile strategy
4. 🟢 Advanced Integrations (Ongoing) - Ecosystem expansion

---

## 🎯 Quick Wins (Easy & High Impact)

1. **Tech Job Notes** - Small effort, immediate value for techs
2. **Outstanding Balance Check** - Small effort, important for collections
3. **Activity Logging** - Small effort, better audit trail
4. **Proper Logout** - Small effort, security best practice
5. **Job Automation Suggestions UI** - Small effort, showcase AI features
6. **Check for Existing Invoice** - Small effort, prevents duplicates
7. **Change Request Email Notifications** - Small effort, better communication

---

## 💡 New Sprint-Based Implementation Strategy

### Sprint Planning Guidelines

- **Sprint Duration:** 2 weeks each
- **Daily Standups:** Quick progress updates
- **Sprint Reviews:** Demo completed features
- **Sprint Retrospectives:** Continuous improvement
- **Definition of Done:** Tested, documented, deployed

### Sprint 1: Tech Portal Completion (Priority: HIGH)

**Goal:** Complete technician experience for better field operations

**Success Metrics:**

- Techs can manage their profiles
- Job checklists improve quality assurance
- Automated quote-to-job conversion

**Risks:** Complex checklist customization
**Dependencies:** Job status workflow stability

### ✅ Sprint 2: Customer Communication - COMPLETED (Priority: HIGH)

**Goal:** Enhance customer self-service and support

**Success Metrics:**

- ✅ Customers can submit categorized support requests with email notifications
- ✅ Emergency requests get priority routing with urgent email alerts
- ✅ Property management UI fully implemented with validation

**Risks:** Customer portal authentication complexity - MITIGATED with existing auth patterns
**Dependencies:** Existing portal infrastructure - COMPLETED

### ✅ Sprint 3: Billing Workflow - COMPLETED (Priority: MEDIUM)

**Goal:** Complete end-to-end billing and communication

**Success Metrics:**

- ✅ Invoices sent with custom email/SMS options and PDF attachments
- ✅ Email attachments enhanced with preview and secure download
- ✅ Billing workflow fully automated with tracking and logging

**Risks:** Email service integration complexity - RESOLVED with Resend integration
**Dependencies:** Resend/Twilio API access - COMPLETED with fallback handling

### ✅ Sprint 4: AI & Templates - COMPLETED (Priority: MEDIUM)

**Goal:** Leverage AI for operational efficiency

**Success Metrics:**

- ✅ OpenAI Vision API integrated with automatic tool detection
- ✅ Complete job template system with customizable forms
- ✅ Gmail connection management with sync controls

**Risks:** AI API costs managed with fallbacks
**Dependencies:** OpenAI API integrated successfully

### ✅ Sprint 5: Production Readiness - COMPLETED (Priority: HIGH)

**Goal:** Secure, scalable, multi-tenant platform

**Success Metrics:**

- ✅ Role-based permissions system with custom overrides
- ✅ Multi-tenant data isolation via account_id filtering
- ✅ Customer portal authentication and user linking

**Risks:** Complex permission matrix design - RESOLVED with flexible system
**Dependencies:** Database schema changes - COMPLETED with migrations

---

## 📊 Updated Statistics

- **✅ Completed Quick Wins:** 7/7 items (100% completion)
- **✅ Completed Sprints:** 5/6 sprints (83% completion)
- **✅ Completed Features:** 17/24 total features (71% completion)
- **🔄 Remaining Features:** 7 items across future roadmap
- **📅 Timeline:** Future development (ongoing)
- **👥 Total Effort:** 15-30 developer days remaining
- **🎯 Sprint Focus:** Future roadmap items (Q2-Q3 2025)
- **🚀 Next Milestone:** Future roadmap implementation begins

## 🐛 **UX Fixes Completed**

- **Admin Today Page**: Fixed incorrect redirect to tech portal, now shows admin-specific today overview with jobs, invoices, and alerts

---

## 📈 Success Metrics & KPIs

### Sprint Success Criteria

- **Velocity:** 80-90% of planned story points completed
- **Quality:** Zero critical bugs in production
- **User Adoption:** Feature usage tracked and measured
- **Performance:** No degradation in app responsiveness

### Business Impact Metrics

- **Tech Efficiency:** Time saved per job via checklists/templates
- **Customer Satisfaction:** Support request resolution time
- **Revenue:** Invoice send rate and payment collection speed
- **Retention:** User engagement with new features

### Technical Health Metrics

- **Code Coverage:** Maintain 80%+ test coverage
- **Performance:** Core pages load under 2 seconds
- **Reliability:** 99.5% uptime target
- **Security:** Zero security vulnerabilities

---

## 🚨 Risk Assessment & Mitigation

### High Risk Items

1. **Permissions System** - Complex matrix, high security impact
   - _Mitigation:_ Start with simple roles, iterate based on feedback
2. **AI Tool Recognition** - API costs, accuracy concerns
   - _Mitigation:_ Pilot with limited users, monitor costs closely
3. **Multi-Tenant Data Isolation** - Data leakage prevention critical
   - _Mitigation:_ Comprehensive testing, audit logging

### Medium Risk Items

1. **Email Integration** - External service dependencies
   - _Mitigation:_ Fallback mechanisms, retry logic
2. **Customer Portal** - Authentication complexity
   - _Mitigation:_ Leverage existing auth patterns

### Low Risk Items

1. **Job Templates** - UI/UX focused
2. **Property Creation** - Form-based feature
3. **Auto-Conversion** - Simple workflow automation

---

## 🔄 Maintenance & Governance

### Sprint Cadence

- **Planning:** Monday mornings (30 minutes)
- **Daily Standups:** Tuesday-Friday (15 minutes)
- **Reviews:** Friday afternoons (30 minutes)
- **Retrospectives:** End of sprint (45 minutes)

### Documentation Updates

- **Sprint Completion:** Update feature status and metrics
- **Code Changes:** Document breaking changes and migrations
- **User Feedback:** Incorporate into backlog prioritization
- **Monthly Review:** Assess progress against roadmap

### Quality Gates

- **Code Review:** Required for all changes
- **Testing:** Unit tests for new features, integration tests for workflows
- **Security Review:** Critical for auth/permission changes
- **Performance Testing:** Before production deployment

**Last Updated:** December 19, 2025
**Sprint 1 Completed:** December 17, 2025
**Sprint 2 Completed:** December 18, 2025
**Sprint 3 Completed:** December 19, 2025
**Last Updated:** December 23, 2025
**Sprint 1 Completed:** December 17, 2025
**Sprint 2 Completed:** December 18, 2025
**Sprint 3 Completed:** December 19, 2025
**Sprint 4 Completed:** December 21, 2025
**Sprint 5 Completed:** December 20, 2025
**All Core Sprints:** COMPLETED ✅
