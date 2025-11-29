# Square API 401 Unauthorized Error - How to Fix

## The Problem
You're getting a 401 Unauthorized error when trying to import customers from Square.

## Root Cause
Your Square access token is either:
1. Invalid or expired
2. For sandbox but you're using production environment (or vice versa)
3. Doesn't have the required permissions

## How to Fix

### Step 1: Get a Fresh Access Token

**For Sandbox (Testing):**
1. Go to https://developer.squareup.com
2. Log in to your Square Developer account
3. Click on your application (or create one if you haven't)
4. Go to "Credentials" tab
5. Look for "Sandbox" section
6. Copy the **Sandbox Access Token** (starts with `EAAA`)

**For Production (Live Data):**
1. Same as above, but copy from "Production" section
2. Make sure you've completed Square's requirements for production access

### Step 2: Update Your .env.local

```bash
# For SANDBOX testing (recommended to start)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your-sandbox-access-token-here

# OR for PRODUCTION (live data)
SQUARE_ENVIRONMENT=production  
SQUARE_ACCESS_TOKEN=your-production-access-token-here
```

**IMPORTANT:** Make sure the environment matches your token!
- Sandbox token → `SQUARE_ENVIRONMENT=sandbox`
- Production token → `SQUARE_ENVIRONMENT=production`

### Step 3: Verify Permissions

Your Square application needs these OAuth scopes:
- `CUSTOMERS_READ` - to read customer data

To check/update permissions:
1. Go to your Square Developer Dashboard
2. Click your application
3. Go to "OAuth" tab
4. Make sure `CUSTOMERS_READ` is checked

### Step 4: Test the Connection

Run this test script:
```bash
node scripts/test-square.js
```

You should see:
```
✅ Success!
- Status code: 200
- Customers found: X
```

### Step 5: Restart the Dev Server

```bash
# Kill the existing server
pkill -f "next dev"

# Start fresh
npm run dev
```

Now try the import again in the browser at http://localhost:3000/clients

## Common Issues

### "This request could not be authorized"
- Wrong environment (sandbox token with production environment or vice versa)
- Expired access token
- Access token missing or malformed

### "Forbidden" or 403 Error
- Your app doesn't have CUSTOMERS_READ permission
- Need to request production access from Square

### No Customers Found
- You're using sandbox and haven't created test customers
- Create test customers at https://developer.squareup.com/apps → Your App → Sandbox Test Accounts

## Creating Test Customers in Sandbox

1. Go to https://developer.squareup.com
2. Click your application
3. Go to "Sandbox Test Accounts"
4. Use the Square Dashboard link
5. Go to "Customers" → "Add Customer"
6. Add some test customers

## Next Steps

Once you see ✅ Success in the test script:
1. Restart your dev server
2. Go to http://localhost:3000/clients
3. Click "Import from Square"
4. Your customers should import successfully!
