# Login Debug Guide

## Current Status

✅ **Database**: RLS policies working correctly (verified with `check-rls-status.js`)  
✅ **Tenants**: 4 accounts, 6 users, 4 memberships configured  
✅ **Backend**: Login flow works in Node.js tests  
❌ **Browser**: Login button "does nothing" - needs investigation

## What I've Fixed

### 1. RLS Infinite Recursion Issue ✅

- **Problem**: `account_memberships` table had circular RLS policies
- **Fix**: Created migration 039 with `user_is_account_admin()` function
- **Status**: Applied and verified working

### 2. Enhanced Login Error Handling ✅

- **What**: Added console.log statements throughout login flow
- **Why**: To diagnose why button clicks don't work
- **File**: `app/auth/login/page.tsx`

## Debugging Steps

### Step 1: Check Browser Console

1. Open http://localhost:3000/auth/login
2. Press F12 to open DevTools
3. Go to Console tab
4. Click "Sign In" button
5. Look for these log messages:

```
🔐 Attempting login for: admin@demo.com
✅ Auth successful for user: xxx-xxx-xxx
🔍 Fetching membership for user: xxx-xxx-xxx
✅ Membership found: { role: 'OWNER' }
➡️ Redirecting to admin dashboard
```

### Step 2: Check for Errors

Look for any of these in the console:

- ❌ **JavaScript errors** - means code is broken
- ❌ **Network errors** - means API calls failing
- ❌ **CORS errors** - means configuration issue
- ❌ **Infinite recursion** - means migration not applied

### Step 3: Use Test Scripts

Run these to verify backend works:

```bash
# Check RLS is working
node scripts/check-rls-status.js

# Test full login flow
node scripts/test-login-flow.js

# Check tenant setup
node scripts/check-tenant-setup.js
```

## Common Issues & Solutions

### Issue: Button does nothing, no console logs

**Possible causes**:

1. JavaScript not loading
2. Form submission blocked
3. Build cache issue

**Solutions**:

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Issue: "infinite recursion" error in console

**Solution**: Apply migration 039

```bash
# Show the SQL
cat supabase/migrations/039_fix_rls_infinite_recursion.sql

# Then paste into Supabase SQL Editor
```

### Issue: Login works but redirect fails

**Check**: Middleware configuration in `middleware.ts`

The middleware should:

- Allow `/auth/login` without auth
- Protect `/admin/*`, `/tech/*`, `/portal/*`
- Set headers for account context

### Issue: "No membership found" error

**Causes**:

1. User not linked to any account
2. RLS blocking the query
3. User is a customer (should go to `/portal/home`)

**Solution**:

```bash
# Check memberships
node scripts/check-tenant-setup.js

# Or create manually in Supabase dashboard
```

## Test Credentials

All demo passwords: `demo123`

| Email             | Role     | Should redirect to |
| ----------------- | -------- | ------------------ |
| admin@demo.com    | OWNER    | /admin/dashboard   |
| tech@demo.com     | TECH     | /tech/today        |
| customer@demo.com | CUSTOMER | /portal/home       |

## Files Modified

1. **app/auth/login/page.tsx** - Added console logging
2. **supabase/migrations/039_fix_rls_infinite_recursion.sql** - Fixed RLS
3. **scripts/check-rls-status.js** - Verify RLS working
4. **scripts/test-login-flow.js** - Test login backend

## Next Steps After Debugging

Once login works:

1. ✅ Test all three user roles (admin, tech, customer)
2. ✅ Verify redirects work correctly
3. ✅ Check that protected routes require login
4. ✅ Test logout functionality
5. ✅ Create your real business account
6. ✅ Remove or disable demo accounts for production

## Quick Commands

```bash
# Start dev server
npm run dev

# Check everything
node scripts/check-tenant-setup.js
node scripts/check-rls-status.js

# View migration SQL
cat supabase/migrations/039_fix_rls_infinite_recursion.sql

# Clear cache and restart
rm -rf .next && npm run dev
```

## Getting Help

If still stuck, share:

1. Browser console output (screenshot or copy/paste)
2. Network tab showing failed requests
3. Output from `node scripts/check-rls-status.js`
4. Any error messages displayed on screen

The detailed console logs will show exactly where the login flow is failing.
