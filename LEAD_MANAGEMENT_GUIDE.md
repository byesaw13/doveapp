# Multi-Channel Lead Management System

## Overview

DoveApp now has a comprehensive lead management system that captures leads from **every channel** - phone, email, text, website, and more. This guide explains how to use each feature.

---

## 🎯 Key Features

### 1. **Unified Lead Inbox** (`/leads/inbox`)

Your command center for all incoming leads, regardless of source.

**Features:**

- Real-time feed of all leads from last 30 days
- Color-coded by source (phone, email, website, etc.)
- **Urgency scoring** - automatically prioritizes leads based on:
  - Priority level (urgent/high/medium/low)
  - Status (new leads ranked higher)
  - Value ($5k+ and $10k+ get bonuses)
  - Recency (leads <1hr, <4hr, <24hr get boost)
- Auto-refreshes every 30 seconds
- Quick filters: All, New, Contacted, Urgent Only

**Quick Actions on Each Lead:**

- ☎️ **Call** - Opens phone dialer, marks as "contacted"
- 💬 **Text** - Opens SMS app
- ✉️ **Email** - Opens email client
- 📄 **Create Estimate** - Pre-fills estimate form

**When to Use:**

- First thing every morning
- Throughout the day to catch new leads instantly
- Before calling back leads

---

### 2. **Quick-Add Mobile Widget** (Floating + Button)

A floating button that appears on mobile devices, allowing you to capture leads **while on phone calls**.

**Features:**

- Always visible on mobile (bottom-right corner)
- 🎤 **Voice-to-text** for service description
- Auto-fills caller ID phone number (if available)
- Minimal fields - just the essentials
- Takes <30 seconds to capture a lead

**How to Use:**

1. Customer calls → tap the blue + button
2. Enter name and phone while talking
3. Tap "Voice" button and describe what they need
4. Hit "Save Lead"
5. Continue the conversation

**Pro Tip:** Set follow-up reminder during the call so you don't forget.

---

### 3. **Email-to-Lead Automation**

AI automatically creates leads from incoming emails.

**How It Works:**

1. Email arrives in your inbox
2. AI analyzes the content
3. If it's a lead inquiry:
   - Extracts: name, phone, email, service type, budget
   - Creates lead automatically in "New" status
   - Sends you an alert notification
4. Lead appears in your inbox within seconds

**Supported Email Patterns:**

- Quote requests
- Service inquiries
- "Can you help with..."
- Referrals with contact info
- Website form submissions

**What Gets Extracted:**

- Contact name
- Email address
- Phone number (if mentioned)
- Service type (painting, roofing, etc.)
- Budget hints ("around $5,000")
- Urgency ("ASAP", "this weekend")

**Email Categories:**

- ✉️ **Leads** - Auto-creates lead
- 💰 **Billing** - Invoices, payments
- 💳 **Spending** - Vendor bills, receipts
- 📋 **Other** - General correspondence

---

### 4. **Lead Source Analytics** (`/leads/analytics`)

See which marketing channels work best for your business.

**Metrics Tracked:**

- **Total Leads** per source
- **Conversion Rate** (% that become customers)
- **Average Value** ($ per converted lead)
- **Avg. Time to Convert** (days from lead to customer)

**Lead Sources:**

- 📞 Phone
- ✉️ Email
- 🌐 Website
- 📱 Social Media
- 🤝 Referral
- 👤 Walk-in
- 📺 Advertisement
- ❓ Other

**Recommendations Shown:**

- 🏆 Best converting source
- 📊 Highest volume source
- 💰 Highest value source

**How to Use:**

- Review monthly to adjust marketing spend
- Double down on high-converting channels
- Identify weak sources and improve or cut them

---

## 📱 Mobile Workflow

### Scenario: Customer Calls While You're On a Job

1. **Answer the call** (keep working if possible)
2. **Tap the blue + button** (bottom-right)
3. **Fill in while talking:**
   - Name: "John Smith"
   - Phone: Auto-filled from caller ID
   - Source: Phone
   - Priority: High
4. **Tap "Voice" button** → speak: "Deck repair, about 200 sq ft, wants estimate this week"
5. **Tap "Save Lead"**
6. **Continue the call**, confirm you'll send estimate later
7. Lead is now in your inbox to follow up

**Time: 20 seconds**

---

## 💡 Best Practices

### Daily Routine

**Morning (8 AM):**

1. Open Lead Inbox
2. Filter by "Urgent Only"
3. Call all urgent leads first
4. Filter by "New"
5. Contact new leads from yesterday

**Midday (12 PM):**

- Check inbox for new leads
- Respond to high-priority emails

**Evening (5 PM):**

- Final inbox check
- Set follow-up tasks for tomorrow

### Lead Response Times

- **Urgent:** Within 1 hour
- **High:** Within 4 hours
- **Medium:** Within 24 hours
- **Low:** Within 48 hours

**Industry Standard:** Responding within 5 minutes increases conversion by 900%. Use mobile widget!

### Source Tracking

Always track the lead source accurately:

- Phone calls → "Phone"
- Text messages → "Phone" (or create "SMS" if you want to track separately)
- Email inquiries → Auto-tracked as "Email"
- Website forms → "Website"
- Social media DMs → "Social Media"
- Customer referrals → "Referral"
- Paid ads → "Advertisement"

---

## 🔔 Notification Settings

The system sends alerts for:

- ✅ New lead created (email, push notification)
- ⏰ Follow-up reminder due
- 🚨 High-value lead (>$5k)
- ⚡ Urgent priority lead

---

## 📊 Reports & Analytics

### Weekly Review

Check `/leads/analytics` every Monday:

- Which source performed best last week?
- What's your current conversion rate?
- Are you responding fast enough?

### Monthly Review

1. Review conversion rates by source
2. Calculate marketing ROI
3. Adjust lead routing rules
4. Train team on weak areas

---

## 🆘 Troubleshooting

### "Lead Inbox is Empty"

- Check filter (try "All" instead of "New")
- Leads older than 30 days don't show (see "All Leads" page)

### "Email Lead Wasn't Auto-Created"

- Check if email was categorized as "Other" or "Junk"
- AI needs clear lead indicators (quote, estimate, service request)
- Manual create from email page

### "Voice Input Not Working"

- Feature requires Chrome/Safari on mobile
- Grant microphone permissions
- Fall back to typing

### "Quick-Add Button Not Showing"

- Only visible on mobile devices (<1024px width)
- Check you're not in desktop mode

---

## 🚀 Advanced Features

### Lead Assignment Rules (Coming Soon)

Automatically route leads to team members:

- "Plumbing leads → Joe"
- "Leads >$10k → Owner"
- "After-hours → Next-day queue"

### SMS Integration (Coming Soon)

- Two-way texting from app
- Auto-track text conversations as leads
- Bulk SMS campaigns

### Call Tracking (Coming Soon)

- Track which marketing campaigns drive phone calls
- Record calls for quality
- Auto-create leads from voicemail transcriptions

---

## 🎓 Training Checklist

For new team members:

- [ ] Tour the Lead Inbox
- [ ] Practice using Quick-Add widget
- [ ] Review analytics dashboard
- [ ] Set up notification preferences
- [ ] Practice calling leads from inbox
- [ ] Understand urgency scoring
- [ ] Learn to track lead sources accurately

---

## 📞 Support

Questions? Check:

1. This guide first
2. In-app tooltips (hover over features)
3. Team lead/manager
4. Technical support

---

**Remember:** Every lead is a potential customer. Respond fast, track accurately, and follow up consistently!
