# Domain Setup Guide for DoveApp

This guide covers how to deploy your Next.js app and connect it to a custom domain.

## Prerequisites

- A registered domain name (e.g., `dovetailservices.com`)
- Access to your domain's DNS settings
- Your app ready to deploy

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js) ⭐

Vercel is made by the creators of Next.js and offers the best integration.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy Your App

```bash
cd /home/nick/dev/doveapp
vercel
```

Follow the prompts:

- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No (first time) or Yes (if re-deploying)
- **Project name?** doveapp (or your preferred name)
- **Directory?** `./` (press Enter)
- **Override settings?** No

The app will deploy and you'll get a URL like: `https://doveapp-xxx.vercel.app`

#### Step 4: Add Environment Variables

```bash
# Add all your .env.local variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add SQUARE_APPLICATION_ID
vercel env add SQUARE_ACCESS_TOKEN
vercel env add EMAIL_WEBHOOK_SECRET
# ... add all other env vars
```

Or add them via Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from your `.env.local`

#### Step 5: Connect Your Domain

**Option A: Domain purchased through Vercel**

1. Go to your project dashboard
2. Click "Domains"
3. Click "Buy" and purchase domain directly

**Option B: External domain (GoDaddy, Namecheap, etc.)**

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Enter your domain: `dovetailservices.com`
   - Click "Add"
   - Vercel will show DNS records to configure

2. **In Your Domain Registrar (e.g., GoDaddy):**

   Add these DNS records:

   ```
   Type    Name    Value
   ────────────────────────────────────────────
   A       @       76.76.21.21
   CNAME   www     cname.vercel-dns.com
   ```

   Or use nameservers (recommended):

   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

3. **Wait for DNS propagation** (5 minutes to 48 hours)

4. **SSL Certificate:** Vercel automatically provisions SSL (HTTPS)

#### Step 6: Set Production Domain

```bash
vercel --prod
```

Your app is now live at your custom domain! 🎉

---

### Option 2: Netlify

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login and Deploy

```bash
cd /home/nick/dev/doveapp
netlify login
netlify init
```

Follow prompts to create new site and deploy.

#### Step 3: Connect Domain

1. Go to https://app.netlify.com
2. Select your site
3. Go to Domain Settings
4. Click "Add custom domain"
5. Add DNS records shown by Netlify to your domain registrar

---

### Option 3: Self-Hosted (VPS/DigitalOcean/AWS)

#### Step 1: Build Production App

```bash
npm run build
```

#### Step 2: Setup Server

**Example with Ubuntu VPS:**

```bash
# On your server
sudo apt update
sudo apt install nodejs npm nginx

# Clone your repo
git clone your-repo-url
cd doveapp
npm install
npm run build

# Install PM2 for process management
npm install -g pm2
pm2 start npm --name "doveapp" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/doveapp
```

Add:

```nginx
server {
    listen 80;
    server_name dovetailservices.com www.dovetailservices.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/doveapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dovetailservices.com -d www.dovetailservices.com
```

#### Step 5: Configure DNS

Point your domain to your VPS IP:

```
Type    Name    Value
────────────────────────────────────
A       @       your.vps.ip.address
A       www     your.vps.ip.address
```

---

## DNS Configuration Reference

### Common Registrars

#### GoDaddy

1. Login to GoDaddy
2. My Products → Domain → DNS
3. Add/Edit DNS records

#### Namecheap

1. Login to Namecheap
2. Domain List → Manage
3. Advanced DNS → Add records

#### Cloudflare

1. Add site to Cloudflare
2. Change nameservers at registrar to Cloudflare's
3. Add DNS records in Cloudflare dashboard

---

## Post-Deployment Checklist

### 1. Update Environment Variables

Make sure these are set in your hosting platform:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# OpenAI
OPENAI_API_KEY=sk-xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Square
SQUARE_APPLICATION_ID=xxx
SQUARE_ACCESS_TOKEN=xxx
SQUARE_ENVIRONMENT=production

# Email Worker Webhook
EMAIL_WEBHOOK_SECRET=xxx

# Next.js
NODE_ENV=production
```

### 2. Update OAuth Redirect URIs

**Google Cloud Console:**

1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add Authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://yourdomain.com/api/gmail/callback
   ```

**Square Developer Dashboard:**

1. Go to https://developer.squareup.com
2. Your Application → OAuth
3. Add redirect URL:
   ```
   https://yourdomain.com/api/square/callback
   ```

### 3. Update Cloudflare Worker Webhook URL

```bash
cd email-worker
wrangler secret put WEBHOOK_URL
# Enter: https://yourdomain.com/api/email-summaries/webhook
```

### 4. Update Supabase URL in Database

If you have any stored URLs referencing localhost, update them.

### 5. Test Everything

- ✅ Home page loads
- ✅ Database connection works
- ✅ OAuth logins work (Google, Square)
- ✅ Email webhook receives summaries
- ✅ SSL certificate is active (https://)
- ✅ All API routes work

---

## Troubleshooting

### DNS Not Propagating

Check DNS propagation:

```bash
# Check DNS
nslookup yourdomain.com

# Check from different locations
curl -I https://yourdomain.com
```

Online tools:

- https://dnschecker.org
- https://whatsmydns.net

### SSL Certificate Issues

**Vercel/Netlify:** Automatic, wait a few minutes

**Self-hosted:** Renew Let's Encrypt:

```bash
sudo certbot renew
```

### Environment Variables Not Working

- Make sure you redeploy after adding env vars
- Check they're set for Production environment
- Verify syntax (no quotes needed in Vercel/Netlify)

### OAuth Callback Errors

- Double-check redirect URIs match exactly
- Include both `http://` and `https://` in testing
- Clear browser cache

---

## Recommended: Vercel Setup Script

Here's a quick script to deploy to Vercel:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying DoveApp to Vercel..."

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login
echo "Please login to Vercel..."
vercel login

# Deploy
echo "Deploying..."
vercel --prod

echo "✅ Deployment complete!"
echo "Next steps:"
echo "1. Add environment variables in Vercel dashboard"
echo "2. Connect your custom domain"
echo "3. Update OAuth redirect URIs"
```

Make it executable:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Custom Domains:** https://vercel.com/docs/custom-domains

Your app is production-ready! 🎉
