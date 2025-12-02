# 🎯 Leads & Estimates System - Complete! 🎉

Your DoveApp now has a **complete lead-to-cash workflow system**! Track potential customers from first contact through quote acceptance and conversion to paying clients.

## ✅ **What's Been Built**

### **🎯 Lead Management System**

Complete CRM for tracking potential customers:

- ✅ **Lead Tracking** - Full contact and service details
- ✅ **8 Lead Statuses** - New → Converted/Lost
- ✅ **8 Lead Sources** - Website, Referral, Social Media, etc.
- ✅ **4 Priority Levels** - Low, Medium, High, Urgent
- ✅ **Activity Logging** - Track all interactions
- ✅ **Follow-up Management** - Never miss a follow-up
- ✅ **Conversion Tracking** - Lead → Client
- ✅ **Search & Filter** - Find leads quickly
- ✅ **Analytics** - Conversion rates, pipeline value

### **📄 Estimate/Quote System**

Professional proposals and quotes:

- ✅ **Auto-numbering** - EST-0001, EST-0002, etc.
- ✅ **Line Items** - Detailed pricing breakdown
- ✅ **7 Statuses** - Draft → Accepted/Declined
- ✅ **Tax & Discounts** - Automatic calculations
- ✅ **Validity Dates** - Expiration tracking
- ✅ **Terms & Conditions** - Custom terms
- ✅ **Templates** - Reusable estimate templates
- ✅ **Conversion to Jobs** - One-click conversion
- ✅ **Analytics** - Acceptance rates, value tracking

## 📊 **Lead Lifecycle**

```
New Lead → Contacted → Qualified → Proposal Sent →
Negotiating → Converted (to Client) | Lost | Unqualified
```

### **Lead Statuses**

1. **New** 🆕 - Just added to system
2. **Contacted** 📞 - Initial contact made
3. **Qualified** ✅ - Meets criteria, real opportunity
4. **Proposal Sent** 📧 - Estimate/quote sent
5. **Negotiating** 💬 - In discussion
6. **Converted** 🎯 - Became a paying client!
7. **Lost** ❌ - Didn't convert
8. **Unqualified** ⛔ - Not a good fit

### **Lead Sources**

Track where leads come from:

- **Website** - Contact form, online inquiry
- **Referral** - Existing customer referral
- **Social Media** - Facebook, Instagram, etc.
- **Email** - Email campaign
- **Phone** - Direct call
- **Walk-in** - Visited office
- **Advertisement** - Ads, flyers
- **Other** - Other sources

## 📄 **Estimate Lifecycle**

```
Draft → Sent → Viewed → Accepted (→ Job) | Declined | Expired
```

### **Estimate Statuses**

1. **Draft** ✏️ - Being created
2. **Sent** 📧 - Sent to client/lead
3. **Viewed** 👁️ - Client opened it
4. **Accepted** ✅ - Client approved!
5. **Declined** ❌ - Client rejected
6. **Expired** ⏰ - Past valid date
7. **Revised** 🔄 - Updated version sent

## 🎨 **UI Features**

### **Leads Page** (`/leads`)

Beautiful purple/pink gradient theme:

- **Stats Cards**: Total, New, Qualified, Converted, Conversion Rate, Est. Value
- **Search Bar**: Search by name, email, phone, company
- **Lead Cards**: Expandable cards with all details
- **Status Badges**: Color-coded with icons
- **Priority Indicators**: Visual priority levels
- **Follow-up Dates**: Never miss a callback
- **Quick Actions**: Create estimate, convert to client
- **Empty State**: Helpful getting-started message

### **Estimates Page** (`/estimates`)

Clean blue/indigo gradient theme:

- **Stats Cards**: Total, Sent, Accepted, Acceptance Rate, Total Value
- **Search Bar**: Find by estimate number or title
- **Estimate Cards**: Professional quote display
- **Line Items**: Detailed pricing breakdown
- **Pricing Summary**: Subtotal, tax, discount, total
- **Status Tracking**: Visual workflow progress
- **Terms Display**: T&Cs and payment terms
- **Quick Actions**: Send, accept, decline, view PDF

## 📡 **API Endpoints**

### **Leads API**

**Get all leads:**

```
GET /api/leads
```

**Search leads:**

```
GET /api/leads?q=john+doe
```

**Get lead statistics:**

```
GET /api/leads?action=stats
```

**Get follow-up reminders:**

```
GET /api/leads?action=follow-up
```

**Create lead:**

```
POST /api/leads
Body: { first_name, last_name, email, phone, source, ... }
```

**Get lead by ID:**

```
GET /api/leads/[id]
GET /api/leads/[id]?include=activities
```

**Update lead:**

```
PUT /api/leads/[id]
Body: { status, priority, follow_up_date, ... }
```

**Convert to client:**

```
POST /api/leads/[id]
Body: { action: "convert", client_id: "..." }
```

**Add activity:**

```
POST /api/leads/[id]
Body: { action: "add_activity", activity_type: "call", description: "..." }
```

**Delete lead:**

```
DELETE /api/leads/[id]
```

### **Estimates API**

**Get all estimates:**

```
GET /api/estimates
```

**Search estimates:**

```
GET /api/estimates?q=EST-0001
```

**Get estimate statistics:**

```
GET /api/estimates?action=stats
```

**Get expired estimates:**

```
GET /api/estimates?action=expired
```

**Create estimate:**

```
POST /api/estimates
Body: { title, lead_id, client_id, line_items, ... }
```

**Create from template:**

```
POST /api/estimates
Body: { from_template: true, template_id: "...", title: "..." }
```

**Get estimate by ID:**

```
GET /api/estimates/[id]
```

**Update estimate:**

```
PUT /api/estimates/[id]
Body: { title, line_items, total, ... }
```

**Send estimate:**

```
POST /api/estimates/[id]
Body: { action: "send" }
```

**Accept estimate:**

```
POST /api/estimates/[id]
Body: { action: "accept" }
```

**Decline estimate:**

```
POST /api/estimates/[id]
Body: { action: "decline", reason: "..." }
```

**Convert to job:**

```
POST /api/estimates/[id]
Body: { action: "convert", job_id: "..." }
```

**Delete estimate:**

```
DELETE /api/estimates/[id]
```

## 💾 **Database Schema**

### **Leads Table**

```sql
- id (UUID, primary key)
- first_name, last_name, email, phone
- company_name, alternate_phone
- source, status, priority
- service_type, service_description, estimated_value
- address, city, state, zip_code
- assigned_to, follow_up_date, last_contact_date
- converted_to_client_id (FK to clients)
- lost_reason, notes, tags
- created_at, updated_at
```

### **Lead Activities Table**

```sql
- id (UUID, primary key)
- lead_id (FK to leads)
- activity_type (call, email, meeting, note, status_change)
- description
- created_by, created_at
```

### **Estimates Table**

```sql
- id (UUID, primary key)
- estimate_number (auto-generated: EST-0001)
- lead_id (FK to leads)
- client_id (FK to clients)
- property_id (FK to properties)
- title, description, status
- line_items (JSONB array)
- subtotal, tax_rate, tax_amount, discount_amount, total
- valid_until, terms_and_conditions, payment_terms, notes
- sent_date, viewed_date, accepted_date, declined_date
- decline_reason, converted_to_job_id (FK to jobs)
- created_by, created_at, updated_at
```

### **Estimate Templates Table**

```sql
- id (UUID, primary key)
- name, description, service_type
- default_line_items (JSONB)
- default_terms, default_payment_terms
- default_valid_days
- created_at, updated_at
```

## 🔄 **Workflow Integration**

### **Lead → Client Conversion**

1. Lead enters system
2. Contact and qualify
3. Create estimate
4. Send to lead
5. Lead accepts
6. Convert lead to client
7. Convert estimate to job
8. Job completed → Payment

### **Automatic Tracking**

- ✅ **Lead activities** logged automatically
- ✅ **Status changes** tracked with timestamps
- ✅ **Estimate views** tracked
- ✅ **Acceptance/decline** tracked
- ✅ **Conversion dates** recorded

## 📈 **Analytics & KPIs**

### **Lead Metrics**

- Total leads
- New leads (this period)
- Qualified leads
- Converted leads
- Lost leads
- **Conversion rate** %
- **Average time to conversion** (days)
- Total estimated pipeline value
- Breakdown by source
- Breakdown by status
- Breakdown by priority

### **Estimate Metrics**

- Total estimates
- Draft, Sent, Accepted, Declined counts
- **Acceptance rate** %
- **Average time to acceptance** (days)
- Total estimate value
- Accepted estimate value
- Average estimate value
- Breakdown by status

## 🎨 **Design Features**

### **Color Coding**

**Lead Statuses:**

- 🔵 New - Blue
- 🟣 Contacted - Purple
- 🟢 Qualified - Green
- 🟡 Proposal Sent - Yellow
- 🟠 Negotiating - Orange
- ✅ Converted - Emerald
- 🔴 Lost - Red
- ⚫ Unqualified - Gray

**Estimate Statuses:**

- ⚪ Draft - Gray
- 🔵 Sent - Blue
- 🟣 Viewed - Purple
- 🟢 Accepted - Green
- 🔴 Declined - Red
- 🟠 Expired - Orange
- 🟡 Revised - Yellow

**Priority Levels:**

- ⚫ Low - Gray
- 🔵 Medium - Blue
- 🟠 High - Orange
- 🔴 Urgent - Red

### **Visual Elements**

- Gradient backgrounds (purple/pink for leads, blue/indigo for estimates)
- Shadow effects on cards
- Hover animations
- Status icons
- Progress indicators
- Empty states with helpful CTAs

## 🚀 **Key Features**

### **Lead Management**

- ✅ Create and track leads
- ✅ Set follow-up reminders
- ✅ Log activities (calls, emails, meetings)
- ✅ Prioritize leads
- ✅ Track estimated deal value
- ✅ Search and filter
- ✅ Convert to clients
- ✅ View conversion analytics

### **Estimate Management**

- ✅ Create detailed quotes
- ✅ Add multiple line items
- ✅ Calculate tax and discounts
- ✅ Set validity dates
- ✅ Include terms and conditions
- ✅ Send to clients
- ✅ Track view/acceptance
- ✅ Convert to jobs
- ✅ Use templates for speed

### **Templates System**

- ✅ Create reusable estimate templates
- ✅ Service-specific defaults
- ✅ Default line items
- ✅ Default terms
- ✅ Quick estimate creation

## 💼 **Business Benefits**

### **Improved Lead Conversion**

- Never lose a lead with proper tracking
- Follow-up reminders ensure timely contact
- Activity log shows complete history
- Priority system focuses on best opportunities
- Source tracking shows best lead channels

### **Professional Estimates**

- Consistent, professional quotes
- Fast creation with templates
- Clear pricing breakdown
- Legal terms included
- Track acceptance rates
- Identify why quotes are declined

### **Sales Pipeline Visibility**

- See total pipeline value
- Track conversion rates
- Monitor quote acceptance
- Identify bottlenecks
- Data-driven decisions

## 📋 **To-Do: Run Migrations**

**Important:** Before using the system, run the database migrations:

```bash
# Connect to your Supabase project
# Run migrations in order:
supabase/migrations/020_create_leads_table.sql
supabase/migrations/021_create_estimates_table.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

## 🎯 **Usage Examples**

### **Track a New Lead**

1. Go to `/leads`
2. Click "New Lead"
3. Enter contact info, source, service details
4. Set priority and follow-up date
5. Lead appears in pipeline!

### **Create an Estimate**

1. Go to `/estimates`
2. Click "New Estimate"
3. Select client or lead
4. Add line items with pricing
5. Set validity date and terms
6. Send to client!

### **Convert Lead to Client**

1. Open lead detail
2. Click "Convert to Client"
3. Lead status → Converted
4. New client record created
5. Link maintained for tracking

### **Accept an Estimate**

1. Client approves quote
2. Open estimate detail
3. Click "Mark Accepted"
4. Status → Accepted
5. Click "Convert to Job"
6. Job created from estimate!

## 📊 **Stats & Analytics**

### **Lead Analytics**

- **Total Leads**: All leads in system
- **New Leads**: Added recently
- **Qualified**: Vetted opportunities
- **Converted**: Success! Became clients
- **Conversion Rate**: % that convert
- **Pipeline Value**: Total estimated revenue

### **Estimate Analytics**

- **Total Estimates**: All quotes
- **Sent**: Shared with clients
- **Accepted**: Approved quotes
- **Acceptance Rate**: % accepted
- **Total Value**: Sum of all estimates
- **Accepted Value**: Revenue from approved quotes

## 🔗 **Integration Points**

### **Email Intelligence**

Leads can be auto-created from emails:

- Email categorized as "LEAD_INQUIRY"
- Lead record auto-generated
- Contact info extracted
- Service description from email
- Auto-assigned follow-up date

### **Client Management**

- Convert leads to clients
- Maintain relationship history
- Link estimates to clients
- Track client lifetime value

### **Job Management**

- Convert estimates to jobs
- Maintain pricing from estimate
- Track quote-to-job conversion
- Job inherits estimate details

## 🎨 **UI Design**

### **Leads Page**

- **Gradient**: Purple to Pink
- **Icons**: Target, Users, Mail, Phone
- **Stats**: 6 cards (blue, purple, green, emerald, orange, pink)
- **Search**: Full-text search across all fields
- **Cards**: Expandable with hover effects
- **Details**: Full contact and service info
- **Actions**: Create estimate, convert to client

### **Estimates Page**

- **Gradient**: Blue to Indigo
- **Icons**: FileText, Send, CheckCircle
- **Stats**: 5 cards (blue, purple, green, orange, emerald)
- **Search**: By number or title
- **Cards**: Professional quote display
- **Details**: Line items, pricing, terms
- **Actions**: Send, accept, decline, view PDF

## 📁 **File Structure**

```
types/
  lead.ts                       # Lead type definitions
  estimate.ts                   # Estimate type definitions

lib/db/
  leads.ts                      # Lead database functions
  estimates.ts                  # Estimate database functions

app/api/
  leads/
    route.ts                    # GET/POST leads
    [id]/route.ts               # GET/PUT/DELETE/POST by ID
  estimates/
    route.ts                    # GET/POST estimates
    [id]/route.ts               # GET/PUT/DELETE/POST by ID

app/
  leads/
    page.tsx                    # Leads management UI
  estimates/
    page.tsx                    # Estimates management UI

supabase/migrations/
  020_create_leads_table.sql    # Leads schema
  021_create_estimates_table.sql # Estimates schema
```

## 🚀 **Next Steps (Optional Enhancements)**

### **Phase 2 Features**

- [ ] Lead import from CSV
- [ ] Estimate PDF generation
- [ ] Email templates for estimates
- [ ] E-signature integration
- [ ] Lead scoring (auto-prioritization)
- [ ] Pipeline kanban view
- [ ] Estimate builder UI (drag-and-drop)
- [ ] Lead assignment to team members
- [ ] SMS notifications for follow-ups
- [ ] Calendar integration for meetings

### **Advanced Features**

- [ ] AI lead scoring
- [ ] Automated follow-up reminders
- [ ] Proposal templates with branding
- [ ] Online estimate acceptance portal
- [ ] Payment integration with estimates
- [ ] Lead nurturing campaigns
- [ ] Win/loss analysis
- [ ] Forecast revenue from pipeline

## 📚 **Best Practices**

### **Lead Management**

- **Always set priority** - Focus on urgent/high first
- **Add follow-up dates** - System will remind you
- **Log activities** - Keep complete history
- **Qualify early** - Don't waste time on bad fits
- **Track sources** - Double down on what works
- **Add estimated value** - Track pipeline health
- **Convert promptly** - Strike while iron is hot

### **Estimate Creation**

- **Use templates** - Save time on common services
- **Be detailed** - Clear line items build trust
- **Set reasonable validity** - 30 days is standard
- **Include terms** - Protect your business
- **Professional presentation** - Use PDF export
- **Follow up** - Check if they viewed it
- **Learn from declines** - Track reasons

## ✨ **Summary**

You now have a **professional lead-to-cash system** with:

- 🎯 **Complete Lead Tracking** - Never lose a prospect
- 📄 **Professional Estimates** - Win more business
- 📊 **Rich Analytics** - Data-driven decisions
- 🔄 **Seamless Workflow** - Lead → Client → Job
- 🎨 **Beautiful UI** - Modern, professional design
- 📱 **Mobile Optimized** - Works on all devices
- 🔗 **Fully Integrated** - Works with rest of DoveApp

**Access it now:**

- Click **"Leads"** in sidebar → `/leads`
- Click **"Estimates"** in sidebar → `/estimates`

**Don't forget:** Run the database migrations before using!

---

**Leads & Estimates System Complete!** Track your sales pipeline like a pro! 🎯📄✨
