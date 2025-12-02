# DoveApp Email Monitor - Cloudflare Worker

External email monitoring service that watches Gmail, summarizes emails with OpenAI, and sends summaries to your DoveApp via webhook.

## Why This Architecture?

**Before (Bloated):**

- Full email client built into main app
- Gmail API integration in Next.js
- Large dependencies (googleapis, OAuth libraries)
- Complex processing pipeline
- Heavy database storage

**After (Lightweight):**

- Email monitoring runs externally on Cloudflare Workers
- Main app only receives webhook POSTs with summaries
- 90%+ reduction in app complexity
- Minimal database footprint
- Free tier covers most use cases

---

## Setup Guide

### 1. Prerequisites

- Cloudflare account (free tier works)
- Gmail account with API access
- OpenAI API key
- DoveApp deployed with webhook endpoint

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 3. Create KV Namespace

```bash
# Create KV namespace for tracking processed emails
wrangler kv:namespace create EMAIL_TRACKER

# Note the ID from output and update wrangler.toml
```

Update `wrangler.toml` with your KV namespace ID:

```toml
[[kv_namespaces]]
binding = "EMAIL_TRACKER"
id = "your_kv_namespace_id_here"
```

### 4. Get Gmail OAuth Credentials

#### a. Create Gmail API Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "DoveApp Email Monitor"
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app type)
5. Download credentials JSON

#### b. Get Refresh Token

Run this script to get your refresh token:

```bash
# Save as get-gmail-token.js
const readline = require('readline');
const {google} = require('googleapis');

const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving token', err);
    console.log('Your refresh token:', token.refresh_token);
  });
});
```

Run it:

```bash
npm install googleapis
node get-gmail-token.js
```

### 5. Set Secrets in Cloudflare

```bash
cd email-worker

# Gmail credentials
wrangler secret put GMAIL_CLIENT_ID
wrangler secret put GMAIL_CLIENT_SECRET
wrangler secret put GMAIL_REFRESH_TOKEN

# OpenAI
wrangler secret put OPENAI_API_KEY

# Webhook configuration
wrangler secret put WEBHOOK_URL
# Example: https://yourdomain.com/api/email-summaries/webhook

wrangler secret put WEBHOOK_SECRET
# Generate a random secret: openssl rand -base64 32
```

### 6. Configure Main App

Add to your DoveApp `.env.local`:

```env
EMAIL_WEBHOOK_SECRET=same_secret_from_cloudflare
```

### 7. Deploy Worker

```bash
cd email-worker
npm install
npm run deploy
```

### 8. Run Database Migration

```bash
cd ..
# Run the migration in Supabase dashboard or via CLI
# supabase/migrations/023_create_email_summaries_table.sql
```

---

## Testing

### Test Locally

```bash
npm run dev
```

Then trigger manually:

```bash
curl -X POST http://localhost:8787/trigger
```

### Test in Production

```bash
curl -X POST https://doveapp-email-monitor.your-subdomain.workers.dev/trigger
```

### Check Logs

```bash
wrangler tail
```

---

## How It Works

```
┌─────────────┐
│   Gmail     │
│   Inbox     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Cloudflare Worker   │  ← Runs every 10 minutes
│ - Fetch unread      │
│ - Summarize with AI │
│ - Send to webhook   │
└──────┬──────────────┘
       │ HTTP POST
       ▼
┌─────────────────────┐
│   DoveApp           │
│   /api/email-       │
│   summaries/webhook │
│                     │
│   ✓ Store summary   │
│   ✓ Create alerts   │
└─────────────────────┘
```

**Worker Schedule:** Every 10 minutes (configurable in `wrangler.toml`)

**What Gets Processed:**

- Unread emails only
- Skips already processed (tracked in KV)
- Maximum 20 emails per run

**What Gets Sent:**

- Gmail ID and thread ID
- From, subject, received date
- AI summary (1-2 sentences)
- Category (LEAD*NEW, BILLING*\*, etc.)
- Priority (low, medium, high, urgent)
- Action items
- Extracted structured data

---

## Cost Analysis

### Cloudflare Workers (Free Tier)

- **100,000 requests/day** - More than enough
- **10ms CPU time per request**
- **Cost:** $0/month for typical usage

### OpenAI API

- Model: gpt-4o-mini
- ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average email: ~500 tokens input, ~200 tokens output
- **Cost:** ~$0.00015 per email
- 100 emails/day = **~$4.50/month**

### Total Monthly Cost

**~$5/month** (OpenAI only, Cloudflare free)

Compare to running full Gmail integration in your main app:

- Higher compute costs
- Larger bundle size (slower page loads)
- More complexity
- Higher maintenance

---

## Customization

### Change Monitoring Frequency

Edit `wrangler.toml`:

```toml
crons = ["*/5 * * * *"]  # Every 5 minutes
crons = ["0 * * * *"]    # Every hour
```

### Adjust Email Limit

Edit `src/index.ts`:

```typescript
const emails = await gmail.getUnreadEmails(50); // Increase from 20
```

### Customize AI Prompt

Edit `src/openai.ts` to change categorization logic, add new fields, or adjust the prompt.

### Mark Emails as Read

Uncomment in `src/index.ts`:

```typescript
// After processing
await gmail.markAsRead(email.id);
```

---

## Troubleshooting

### Worker Not Running

```bash
# Check worker status
wrangler tail

# Check cron triggers
wrangler triggers list
```

### Gmail Auth Errors

- Refresh token expired → Get new refresh token
- Scopes insufficient → Regenerate with correct scopes
- API disabled → Enable Gmail API in Google Cloud Console

### OpenAI Errors

- Rate limit → Add delays between requests
- Invalid API key → Check `OPENAI_API_KEY` secret
- Token limit → Reduce email content sent to API

### Webhook Errors

- Check `WEBHOOK_SECRET` matches in both places
- Verify `WEBHOOK_URL` is correct
- Check DoveApp logs for webhook endpoint errors

---

## Monitoring

### View Processed Emails

```bash
# Check KV storage
wrangler kv:key list --binding EMAIL_TRACKER
```

### Check Worker Logs

```bash
wrangler tail --format pretty
```

### View Metrics

Dashboard: https://dash.cloudflare.com → Workers → doveapp-email-monitor

---

## Migration from Old System

See `MIGRATION_GUIDE.md` for steps to remove the old email system from your main app.

---

## Support

For issues:

1. Check worker logs: `wrangler tail`
2. Test locally: `npm run dev`
3. Verify secrets are set correctly
4. Check webhook endpoint is accessible
