# DoveApp Quick Reference Card

## ⌨️ Keyboard Shortcuts

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Cmd/Ctrl + K` | Open command palette |
| `Alt + D`      | Dashboard            |
| `Alt + K`      | KPI                  |
| `Alt + L`      | Lead Inbox           |
| `Alt + C`      | Calendar             |
| `Alt + E`      | Estimates            |
| `Alt + J`      | Jobs                 |
| `Alt + T`      | Time Tracking        |
| `Alt + U`      | Clients              |
| `Alt + M`      | Email                |
| `Alt + I`      | Inventory            |

## 📱 Mobile Features

| Feature            | How to Use                           |
| ------------------ | ------------------------------------ |
| **Quick Add Lead** | Tap blue **+** button (bottom-right) |
| **Voice Input**    | Tap microphone icon in form          |
| **Swipe Menu**     | Swipe from left edge to open sidebar |
| **Call Lead**      | Tap "Call" button on lead card       |
| **Text Lead**      | Tap "Text" button on lead card       |

## 🎯 Lead Management Pages

| Page           | URL                | Purpose                       |
| -------------- | ------------------ | ----------------------------- |
| **Lead Inbox** | `/leads/inbox`     | Action center for new leads   |
| **All Leads**  | `/leads`           | Browse all leads (any status) |
| **Analytics**  | `/leads/analytics` | Source performance tracking   |

## 🔔 Notification Badges

Badges show counts for:

- 📧 Unread emails
- 📄 Pending estimates (>7 days)
- ⚠️ Overdue jobs
- 🆕 New leads (last 7 days)
- 📦 Low inventory items

**Auto-refreshes:** Every 30 seconds

## ⚡ Quick Actions

### From Sidebar (All Pages)

- **+ Job** → Create new job
- **+ Client** → Create new client
- **+ Estimate** → Create new estimate

### From Lead Cards

- **Call** → Opens phone dialer
- **Text** → Opens SMS app
- **Email** → Opens email client
- **Estimate** → Pre-fills estimate form

## 📊 Lead Inbox Filters

| Filter        | Shows                           |
| ------------- | ------------------------------- |
| **All**       | All active leads (last 30 days) |
| **New**       | Only "new" status leads         |
| **Contacted** | Contacted + qualified leads     |
| **Urgent**    | High urgency score (100+)       |

## 🎯 Urgency Scoring

Leads auto-scored by:

- **Priority:** Urgent (+100), High (+75), Medium (+50)
- **Status:** New leads (+50)
- **Value:** $5k+ (+25), $10k+ (+25)
- **Recency:** <1hr (+30), <4hr (+20), <24hr (+10)

**Leads sorted by score automatically**

## 📱 Quick Add Lead Form (Mobile)

**Fastest workflow:**

1. Tap blue **+** button
2. Enter: First Name, Last Name, Phone
3. Tap **Voice** → speak service description
4. Tap **Save Lead**

**Time:** 20-30 seconds

## ✉️ Email-to-Lead Automation

**Automatic lead creation when email contains:**

- Quote request keywords
- Service inquiry phrases
- Contact information
- Budget mentions

**AI Extracts:**

- Name
- Phone number
- Email
- Service type
- Estimated budget

**You get:** Instant notification + lead in inbox

## 📈 Lead Source Analytics

**View at:** `/leads/analytics`

**Shows:**

- Conversion rate per source
- Average deal value per source
- Time to convert
- Total leads per source
- ROI recommendations

**Review:** Weekly (minimum)

## 💡 Best Practices

### Response Times

- **Urgent leads:** <1 hour
- **High priority:** <4 hours
- **Medium priority:** <24 hours
- **Low priority:** <48 hours

### Daily Routine

**Morning (8 AM):**

1. Open Lead Inbox
2. Filter "Urgent Only" → call those
3. Filter "New" → contact yesterday's leads

**Midday (12 PM):**

- Quick inbox check for new leads

**Evening (5 PM):**

- Final inbox check
- Set follow-up tasks for tomorrow

### Lead Sources to Track

- 📞 Phone
- ✉️ Email
- 🌐 Website
- 📱 Social Media
- 🤝 Referral
- 👤 Walk-in
- 📺 Advertisement

**Tip:** Always track source accurately for better analytics

## 🆘 Quick Troubleshooting

| Problem                   | Solution                                  |
| ------------------------- | ----------------------------------------- |
| Blue + button not showing | Only visible on mobile (<1024px)          |
| Voice input not working   | Chrome/Safari only, check mic permissions |
| Lead inbox empty          | Check filter, try "All"                   |
| Email lead not created    | Check if email categorized as "leads"     |
| Badges not updating       | Wait 30s or refresh page                  |

## 📞 Getting Help

1. Check this reference card
2. Read `LEAD_MANAGEMENT_GUIDE.md`
3. Review `IMPLEMENTATION_SUMMARY.md`
4. Check in-app tooltips (hover over features)

## 🎓 Training New Team Members

**Essential tasks:**

- [ ] Tour the sidebar navigation
- [ ] Try command palette (Cmd/Ctrl+K)
- [ ] Practice quick-add widget on mobile
- [ ] Review lead inbox filters
- [ ] Understand urgency scoring
- [ ] Test call/text/email buttons
- [ ] Review analytics dashboard
- [ ] Read lead management guide

**Time required:** 30 minutes

---

**Print this card and keep it handy for quick reference!**
