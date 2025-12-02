# External Email Monitoring System

## Overview

Your Gmail inbox is now monitored by an external **Cloudflare Worker** that runs independently from your main application. This dramatically reduces bloat while keeping the AI email summarization functionality.

## Architecture

```
┌──────────────┐
│    Gmail     │
│   Account    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Cloudflare Worker    │ ← Runs every 10 minutes
│ • Checks for unread  │    Free tier
│ • Calls OpenAI API   │
│ • Sends summaries    │
└──────┬───────────────┘
       │ HTTP Webhook
       ▼
┌──────────────────────┐
│   Your DoveApp       │
│ POST /api/email-     │
│   summaries/webhook  │
│                      │
│ Stores in database:  │
│ • email_summaries    │
└──────────────────────┘
```

## What You Get

✅ **Automatic email monitoring** - Every 10 minutes  
✅ **AI summarization** - OpenAI analyzes each email  
✅ **Smart categorization** - LEAD*NEW, BILLING*_, SCHEDULING\__, etc.  
✅ **Priority detection** - Low, medium, high, urgent  
✅ **Action items** - What you need to do  
✅ **Extracted data** - Contact info, amounts, dates

## No More Bloat

**Removed from main app:**

- Gmail API client libraries (~500KB)
- OAuth management code
- Email sync logic
- Complex processing pipelines
- Multiple database tables

**What remains:**

- Simple webhook endpoint (< 100 lines)
- One database table (`email_summaries`)
- Clean, summarized data

## Files Created

### Cloudflare Worker

```
email-worker/
├── src/
│   ├── index.ts        # Main worker with cron job
│   ├── gmail.ts        # Gmail API client
│   ├── openai.ts       # OpenAI summarization
│   └── webhook.ts      # Webhook client
├── wrangler.toml       # Worker configuration
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── README.md           # Setup instructions
```

### Main App Changes

```
app/api/email-summaries/webhook/route.ts  # New webhook endpoint
supabase/migrations/023_create_email_summaries_table.sql  # New table
```

### Documentation

```
EMAIL_WORKER_MIGRATION_GUIDE.md  # How to migrate from old system
EXTERNAL_EMAIL_MONITORING.md      # This file
```

## Quick Start

### 1. Deploy the Worker

```bash
cd email-worker
npm install
wrangler login

# Set secrets
wrangler secret put GMAIL_CLIENT_ID
wrangler secret put GMAIL_CLIENT_SECRET
wrangler secret put GMAIL_REFRESH_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put WEBHOOK_URL
wrangler secret put WEBHOOK_SECRET

# Deploy
npm run deploy
```

### 2. Configure Main App

Add to `.env.local`:

```env
EMAIL_WEBHOOK_SECRET=same_secret_you_set_in_cloudflare
```

### 3. Run Migration

```sql
-- In Supabase SQL editor
-- Run supabase/migrations/023_create_email_summaries_table.sql
```

### 4. Test

```bash
# Check worker logs
wrangler tail

# Check database
-- SELECT * FROM email_summaries ORDER BY created_at DESC LIMIT 10;
```

## Accessing Email Summaries

### Option 1: Database Query

```typescript
import { supabase } from '@/lib/supabase';

const { data } = await supabase
  .from('email_summaries')
  .select('*')
  .order('received_at', { ascending: false })
  .limit(20);
```

### Option 2: Filter by Priority

```typescript
const { data } = await supabase
  .from('email_summaries')
  .select('*')
  .eq('priority', 'high')
  .eq('is_read', false);
```

### Option 3: Filter by Category

```typescript
const { data } = await supabase
  .from('email_summaries')
  .select('*')
  .eq('category', 'LEAD_NEW')
  .order('received_at', { ascending: false });
```

## Cost Breakdown

### Cloudflare Workers (Free Tier)

- 100,000 requests/day included
- Your usage: ~144 requests/day (every 10 min)
- **Cost: $0/month**

### OpenAI API (gpt-4o-mini)

- ~$0.00015 per email
- 100 emails/day = **~$4.50/month**
- 500 emails/day = **~$22.50/month**

### Total

**$5-25/month** depending on email volume

Compare to alternatives:

- Zapier: $20-50/month minimum
- Make.com: $9-29/month
- Self-hosted Node.js: $5/month VPS + maintenance time

## Monitoring

### Worker Health

```bash
# Real-time logs
wrangler tail

# Check status
curl https://your-worker.workers.dev/health
```

### Check Email Processing

```sql
-- How many emails processed today?
SELECT COUNT(*) FROM email_summaries
WHERE created_at >= CURRENT_DATE;

-- What categories are most common?
SELECT category, COUNT(*)
FROM email_summaries
GROUP BY category
ORDER BY COUNT DESC;

-- High priority emails needing action
SELECT subject, from_address, ai_summary
FROM email_summaries
WHERE priority IN ('high', 'urgent')
AND action_required = true
AND is_read = false;
```

## Customization

### Change Monitoring Frequency

Edit `email-worker/wrangler.toml`:

```toml
crons = ["*/5 * * * *"]   # Every 5 minutes
crons = ["0 * * * *"]     # Every hour
crons = ["0 9,17 * * *"]  # 9am and 5pm daily
```

### Adjust Email Limit

Edit `email-worker/src/index.ts`:

```typescript
const emails = await gmail.getUnreadEmails(50); // Process more emails
```

### Customize AI Categorization

Edit `email-worker/src/openai.ts` to:

- Add new categories
- Change priority logic
- Extract additional fields
- Adjust prompt for your business

### Mark Emails as Read

Add to `email-worker/src/index.ts` after processing:

```typescript
await gmail.markAsRead(email.id);
```

## Troubleshooting

### Worker Not Processing Emails

1. Check worker is deployed: `wrangler deployments list`
2. Check cron is active: `wrangler triggers list`
3. View logs: `wrangler tail`

### Gmail Auth Errors

- Token expired → Regenerate refresh token
- Wrong scopes → Need `gmail.readonly` scope
- API disabled → Enable Gmail API in Google Cloud Console

### OpenAI Errors

- Rate limit → Add delays between requests
- Invalid key → Check `OPENAI_API_KEY` secret
- Token limit → Truncate long emails

### Webhook Failures

- Check `WEBHOOK_SECRET` matches in both places
- Verify `WEBHOOK_URL` is correct and accessible
- Check main app logs for webhook endpoint errors

## Migration from Old System

If you have the old built-in email system, follow `EMAIL_WORKER_MIGRATION_GUIDE.md` to:

1. Deploy new system alongside old one
2. Run both in parallel for 1-2 weeks
3. Verify new system works correctly
4. Remove old system code
5. Enjoy ~1MB smaller bundle size!

## API Reference

### Webhook Endpoint

**POST** `/api/email-summaries/webhook`

Headers:

```
Authorization: Bearer your_webhook_secret
Content-Type: application/json
```

Payload:

```json
{
  "gmailId": "string",
  "gmailThreadId": "string",
  "from": "string",
  "subject": "string",
  "receivedAt": "ISO 8601 date",
  "snippet": "string",
  "summary": "string",
  "category": "LEAD_NEW | BILLING_* | SCHEDULING_* | ...",
  "priority": "low | medium | high | urgent",
  "actionRequired": boolean,
  "actionType": "string",
  "actionItems": ["array of strings"],
  "extractedData": {
    "lead": { /* lead data */ },
    "billing": { /* billing data */ },
    "scheduling": { /* scheduling data */ }
  }
}
```

### Database Schema

```sql
email_summaries (
  id UUID PRIMARY KEY,
  gmail_id TEXT UNIQUE NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  snippet TEXT,
  ai_summary TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  action_required BOOLEAN DEFAULT false,
  action_type TEXT DEFAULT 'none',
  action_items JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Support

For detailed setup instructions:

- **Worker setup:** `email-worker/README.md`
- **Migration guide:** `EMAIL_WORKER_MIGRATION_GUIDE.md`
- **Cloudflare docs:** https://developers.cloudflare.com/workers/

For issues:

1. Check worker logs: `wrangler tail`
2. Test locally: `cd email-worker && npm run dev`
3. Verify all secrets are set correctly

---

**Result:** Your email monitoring is now external, lightweight, and costs just a few dollars per month! 🎉
