# Resend Email Setup Guide

## What Was Implemented

✅ Installed Resend npm package
✅ Created `lib/email.ts` with email sending functions
✅ Updated user creation API to send welcome emails
✅ Beautiful HTML email templates

## Setup Instructions

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Get API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name like "DoveApp Development"
4. Copy the API key (starts with `re_`)

### Step 3: Add to .env.local

Add these lines to your `.env.local` file:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

**Important**: Replace `yourdomain.com` with a domain you own, or use the default `onboarding@resend.dev` for testing.

### Step 4: Verify Domain (Production Only)

For production, you need to verify your sending domain:

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually a few minutes)

Once verified, you can send from any email address at that domain:

- `noreply@yourdomain.com`
- `support@yourdomain.com`
- `team@yourdomain.com`

### Step 5: Test It!

1. Make sure your `.env.local` has the API key
2. Restart your dev server: `npm run dev`
3. Go to http://localhost:3000/admin/team
4. Create a new user
5. Check the user's email inbox!

## Email Templates

### Welcome Email Features

The welcome email includes:

- ✅ Professional design with company branding
- ✅ Clear login instructions
- ✅ Temporary password (securely displayed)
- ✅ Direct login link
- ✅ Security reminder to change password
- ✅ Mobile-responsive HTML

### Example Email Content

```
Welcome to [Your Company]! 🎉

Your account has been created! You can now access the field service management system.

Your Login Credentials
━━━━━━━━━━━━━━━━━━━
Login URL: http://localhost:3000/auth/login
Email: user@example.com
Temporary Password: abc123XYZ456

⚠️ Important: Please change your password after your first login.

[Login to Your Account Button]
```

## Development vs Production

### Development (localhost)

- Use `onboarding@resend.dev` as sender
- Free tier: 100 emails/day
- No domain verification needed

### Production

- Use your verified domain
- Free tier: 100 emails/day
- Paid plans available for higher volume
- Better deliverability with verified domain

## Fallback Behavior

If Resend is not configured:

- ✅ User creation still works
- ⚠️ Email is not sent
- 🔑 Password is logged to server console
- 📝 Warning message appears in logs

This allows development without email setup.

## Troubleshooting

### "Email service not configured" warning

**Cause**: `RESEND_API_KEY` is not in `.env.local`

**Fix**: Add the API key to `.env.local` and restart server

### Email not arriving

**Check**:

1. Spam folder
2. Resend dashboard for delivery status
3. Server console for errors
4. Email address is valid

### "Invalid API key" error

**Cause**: API key is incorrect or expired

**Fix**:

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Update `.env.local`
4. Restart server

### Domain verification pending

**Cause**: DNS records not propagated yet

**Fix**:

1. Wait 5-10 minutes
2. Check DNS with: `dig yourdomain.com TXT`
3. Verify records match Resend's instructions

## Pricing

### Free Tier

- 100 emails/day
- 1 domain
- Perfect for development and small teams

### Pro Tier ($20/month)

- 50,000 emails/month
- 10 domains
- Better deliverability
- Priority support

See https://resend.com/pricing for details

## Security Best Practices

### ✅ DO:

- Store API keys in `.env.local` (not committed to git)
- Use verified domains in production
- Implement rate limiting for email sending
- Log email sending for audit trail

### ❌ DON'T:

- Hardcode API keys in source code
- Send emails without user consent
- Use resend.dev in production
- Share API keys publicly

## Next Steps

Once emails are working, consider:

1. **Password Reset Emails**: Already implemented in `lib/email.ts`
2. **Job Assignment Notifications**: Notify techs of new jobs
3. **Invoice Payment Reminders**: Automated follow-ups
4. **Estimate Approval Requests**: Send to customers
5. **Welcome Emails for Customers**: Portal access invites

## Support

- Resend Docs: https://resend.com/docs
- Resend Status: https://status.resend.com
- Support: support@resend.com

## Testing Email Templates

You can test the email template HTML by opening it in a browser:

```javascript
// In browser console or Node REPL
const html = getWelcomeEmailHTML({
  name: 'John Doe',
  tempPassword: 'test123',
  companyName: 'ACME Corp',
});
console.log(html);
```

Copy the output and paste into an HTML file to preview.
