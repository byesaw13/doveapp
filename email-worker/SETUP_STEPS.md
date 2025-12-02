# Quick Setup Steps

## ✅ Completed

- [x] KV namespaces created
- [x] Dependencies installed
- [x] Configuration file updated

## 📝 Next Steps

### 1. Set Secrets

You need to configure these secrets in Cloudflare. Run each command and paste the value when prompted:

```bash
# Gmail OAuth credentials
wrangler secret put GMAIL_CLIENT_ID
wrangler secret put GMAIL_CLIENT_SECRET
wrangler secret put GMAIL_REFRESH_TOKEN

# OpenAI API key
wrangler secret put OPENAI_API_KEY

# Webhook configuration
wrangler secret put WEBHOOK_URL
# Example: https://yourdomain.com/api/email-summaries/webhook

wrangler secret put WEBHOOK_SECRET
# Generate with: openssl rand -base64 32
```

### 2. Get Gmail Credentials

You need to get Gmail OAuth credentials. Two options:

#### Option A: Use Existing Gmail Connection (Easiest)

If you already have Gmail connected in your DoveApp:

1. Check your database for `gmail_connections` table
2. Use the same CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN

#### Option B: Create New Gmail API Project

Follow the guide in `README.md` section "Get Gmail OAuth Credentials"

### 3. Get OpenAI API Key

Get from: https://platform.openai.com/api-keys

### 4. Configure Main App

Add to your DoveApp's `.env.local`:

```env
EMAIL_WEBHOOK_SECRET=same_secret_you_used_above
```

### 5. Run Database Migration

In your main DoveApp directory:

```bash
# Option 1: Via Supabase dashboard
# Copy contents of supabase/migrations/023_create_email_summaries_table.sql
# Paste into SQL Editor and run

# Option 2: Via command line (if you have supabase CLI)
supabase migration up
```

### 6. Deploy Worker

```bash
npm run deploy
```

### 7. Test

```bash
# View logs
wrangler tail

# Manually trigger (for testing)
curl -X POST https://doveapp-email-monitor.your-subdomain.workers.dev/trigger
```

## 🔍 Troubleshooting

### Check if secrets are set

```bash
wrangler secret list
```

### Test locally

```bash
# Create .dev.vars file (copy from .dev.vars.example)
# Add your credentials there
npm run dev
```

### View deployment

```bash
wrangler deployments list
```

## 📚 Full Documentation

- Complete setup guide: `README.md`
- Migration from old system: `../EMAIL_WORKER_MIGRATION_GUIDE.md`
- Overview: `../EXTERNAL_EMAIL_MONITORING.md`
