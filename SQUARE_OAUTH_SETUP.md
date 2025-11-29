# Square OAuth Setup Guide

## 🎉 Much Easier Than Manual Tokens!

With OAuth, you just click "Connect to Square" and authenticate - no more copying/pasting tokens!

## Setup Steps

### 1. Create a Square Application

1. Go to https://developer.squareup.com/apps
2. Click "+" or "Create App" if you don't have one
3. Name it "DoveApp" (or whatever you like)

### 2. Configure OAuth Settings

1. In your Square app, click **"OAuth"** in the left sidebar
2. Under "Redirect URL", add:
   ```
   http://localhost:3000/api/square/oauth/callback
   ```
   
3. Check these permissions:
   - ✓ CUSTOMERS_READ
   - ✓ CUSTOMERS_WRITE  
   - ✓ INVOICES_READ (for future phases)
   - ✓ PAYMENTS_READ (for future phases)

4. Click **"Save"**

### 3. Get Your Credentials

1. Click **"Credentials"** in the left sidebar

2. Copy these values:

   **For Sandbox (Testing):**
   - Application ID (Sandbox)
   - Application Secret (click "Show" first)

   **For Production (Live Data):**
   - Application ID (Production)
   - Application Secret (click "Show" first)

### 4. Update .env.local

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Square OAuth - Sandbox (for testing)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idp-xxxxx
SQUARE_APPLICATION_SECRET=sandbox-sq0csb-xxxxx
SQUARE_ENVIRONMENT=sandbox

# OR for Production:
# NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-xxxxx
# SQUARE_APPLICATION_SECRET=sq0csb-xxxxx
# SQUARE_ENVIRONMENT=production
```

### 5. Run the Migration

In Supabase SQL Editor, run:
```sql
-- Copy and paste the contents of:
supabase/migrations/002_create_square_connections_table.sql
```

### 6. Restart Dev Server

```bash
pkill -f 'next dev'
npm run dev
```

### 7. Connect to Square

1. Go to http://localhost:3000/clients
2. Click **"Connect to Square"** button
3. Log in to Square and authorize the app
4. You'll be redirected back to the clients page
5. Button will now say "Disconnect Square"
6. Click **"Import from Square"** to import customers!

## How It Works

### The OAuth Flow:

1. User clicks "Connect to Square"
2. Redirected to Square's login page
3. User authorizes the app
4. Square redirects back with auth code
5. App exchanges code for access token
6. Token stored securely in Supabase
7. Token auto-refreshes when it expires!

### Advantages Over Manual Tokens:

- ✅ No copying/pasting tokens
- ✅ Tokens don't expire (auto-refresh)
- ✅ More secure
- ✅ Better user experience
- ✅ Works for multiple users (future-proof)

## Troubleshooting

### "Redirect URL not registered"
- Make sure you added `http://localhost:3000/api/square/oauth/callback` in Square OAuth settings
- Exact match required (including http/https and port)

### "Invalid client_id"
- Check `NEXT_PUBLIC_SQUARE_APPLICATION_ID` in .env.local
- Make sure it matches your Square app's Application ID
- Sandbox ID starts with `sandbox-sq0idp-`
- Production ID starts with `sq0idp-`

### "Invalid client_secret"
- Check `SQUARE_APPLICATION_SECRET` in .env.local
- Click "Show" in Square dashboard to see the full secret
- Sandbox secret starts with `sandbox-sq0csb-`
- Production secret starts with `sq0csb-`

### OAuth fails after redirect
- Check browser console for errors
- Verify migration ran successfully (check `square_connections` table exists)
- Check dev server logs for errors

## Production Deployment

When deploying to production:

1. Update redirect URL in Square OAuth settings:
   ```
   https://yourdomain.com/api/square/oauth/callback
   ```

2. Update `.env.local` (or hosting environment vars):
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-xxxxx  # Production ID
   SQUARE_APPLICATION_SECRET=sq0csb-xxxxx  # Production secret
   SQUARE_ENVIRONMENT=production
   ```

3. Users will connect to their real Square accounts!

## Security Notes

- ✅ Tokens stored in Supabase (not in browser)
- ✅ Application Secret never exposed to browser
- ✅ OAuth state parameter prevents CSRF attacks
- ✅ Tokens automatically refresh before expiration
- ⚠️ Enable Supabase RLS policies for multi-user apps

---

**That's it!** OAuth is now set up. Much easier than managing manual tokens! 🎉
