# Deployment Quick Start

## Fastest Way: Use Vercel (5 minutes)

### 1. Run Deployment Script

```bash
./deploy-vercel.sh
```

Or manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 2. Add Environment Variables

Go to https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Copy these from your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SQUARE_APPLICATION_ID
SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID
EMAIL_WEBHOOK_SECRET
```

### 3. Connect Your Domain

**In Vercel Dashboard:**

- Settings → Domains
- Add your domain: `yourdomain.com`

**In Your Domain Registrar (GoDaddy, Namecheap, etc.):**

Add these DNS records:

```
Type    Name    Value
────────────────────────────────────────────
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

**Wait 5-60 minutes for DNS to propagate.**

### 4. Update OAuth Redirect URIs

**Google Cloud Console:**
https://console.cloud.google.com

- APIs & Services → Credentials → OAuth 2.0 Client
- Add Authorized redirect URIs:
  ```
  https://yourdomain.com/api/auth/google/callback
  https://yourdomain.com/api/gmail/callback
  ```

**Square Developer Dashboard:**
https://developer.squareup.com

- Your Application → OAuth
- Add Redirect URL:
  ```
  https://yourdomain.com/api/square/callback
  ```

### 5. Update Cloudflare Worker

```bash
cd email-worker
wrangler secret put WEBHOOK_URL
# Enter: https://yourdomain.com/api/email-summaries/webhook
```

### 6. Test Your Deployment

- ✅ Visit `https://yourdomain.com`
- ✅ Test login
- ✅ Check database connectivity
- ✅ Verify API routes work

---

## Alternative: Self-Hosted

See `DOMAIN_SETUP_GUIDE.md` for VPS deployment instructions.

---

## Troubleshooting

**Site not loading?**

- Check DNS with: `nslookup yourdomain.com`
- Wait longer (DNS can take up to 48 hours)

**OAuth not working?**

- Verify redirect URIs match exactly
- Clear browser cache

**Environment variables not working?**

- Redeploy after adding them: `vercel --prod`

---

## Full Documentation

- **Complete Guide:** `DOMAIN_SETUP_GUIDE.md`
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deploy:** https://nextjs.org/docs/deployment
