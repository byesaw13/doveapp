# Your Square Token is Invalid - Here's How to Get a New One

## The Problem
Your Square access token `EAAAlzryKGNkEKGkGCC_Yc3lQjIUf2-xaImTvlZ93axmQqsxY2I7t29TZIn0HSvs` is being rejected by Square's API.

This happens when:
- Token was revoked or regenerated
- Token is from a different/deleted application
- Token doesn't have proper permissions

## Fix: Get a Fresh Sandbox Token

### Step 1: Go to Square Developer Dashboard
Open in your browser: https://developer.squareup.com/apps

### Step 2: Select or Create an Application
- If you have an existing app, click on it
- If not, click "+" or "Create App"
  - Name it "DoveApp" or anything you like
  - This is just for testing/development

### Step 3: Get the Sandbox Access Token
1. Click "Credentials" in the left sidebar
2. Scroll down to the "Sandbox" section
3. You'll see "Sandbox Access Token"
4. Click the "Show" button (eye icon)
5. Click "Copy" to copy the full token
   - It should start with `EAAA`
   - Should be 64-100 characters long

### Step 4: Verify Permissions (Important!)
1. Click "OAuth" in the left sidebar
2. Make sure these are checked:
   - ✓ CUSTOMERS_READ
   - ✓ CUSTOMERS_WRITE (optional but helpful)
3. If you made changes, click "Save"

### Step 5: Update .env.local
Open the file and replace the SQUARE_ACCESS_TOKEN:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yrprtoiueantymgtxfak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycHJ0b2l1ZWFudHltZ3R4ZmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjYwOTgsImV4cCI6MjA3OTkwMjA5OH0.97ms_CrXvj-f0UI2gAgg-BBLekPrkSWeb8hmdwGvBa4

# Square API Configuration
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=PASTE_YOUR_NEW_TOKEN_HERE
```

### Step 6: Create Some Test Customers (Optional)
So you have data to import:

1. In your app dashboard, find "Sandbox Test Accounts"
2. Click "Open" to open the Sandbox Dashboard
3. Go to "Customers" → "Directory"
4. Click "Add a customer"
5. Add 2-3 test customers with names, emails, addresses

### Step 7: Test It
```bash
# Test with the script
cd /home/nick/dev/doveapp
node scripts/test-square.js
```

You should see:
```
✅ Success!
- Status code: 200
- Customers found: X
```

### Step 8: Restart Dev Server
```bash
pkill -f "next dev"
npm run dev
```

### Step 9: Try Import in Browser
- Go to http://localhost:3000/clients
- Click "Import from Square"
- Should import successfully! 🎉

## Troubleshooting

**Still getting 401?**
- Double-check you copied the ENTIRE token (no spaces or newlines)
- Make sure you're using SANDBOX token (not production)
- Verify .env.local file was saved
- Try regenerating the token in Square dashboard

**No Square Developer Account?**
- Sign up at https://developer.squareup.com/sign-up
- It's free and separate from your regular Square account

**Can't Find Credentials Tab?**
- Make sure you clicked into your specific application
- You should see: Credentials, OAuth, Webhooks, etc. in the left sidebar

**Need Help?**
Share what you see when you run: `node scripts/test-square.js`
