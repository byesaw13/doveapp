# Google Workspace Gmail Integration Setup Guide

This guide will help you set up Google OAuth2 credentials to connect your Gmail account for automatic email processing.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: Your App Name (e.g., "DoveApp")
   - User support email: Your email
   - Developer contact info: Your email
4. For Application type, select "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
6. Save and copy the Client ID and Client Secret

## Step 3: Configure Environment Variables

Create or update your `.env.local` file with the credentials:

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/email-review` in your app
3. Click "Connect Gmail Account"
4. Authorize the app to access your Gmail
5. The app will automatically sync recent emails and categorize them

## Step 5: Production Deployment

When deploying to production:

1. Update the redirect URI in Google Cloud Console to your production domain
2. Update the `GOOGLE_REDIRECT_URI` environment variable
3. Ensure your production environment has the correct credentials

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate your OAuth credentials
- Limit Gmail API scopes to only what's necessary:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.modify`

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Check that your redirect URI exactly matches what's configured in Google Cloud Console
- Ensure the OAuth consent screen is properly configured

### "Invalid client"

- Verify your Client ID and Client Secret are correct
- Check that you're using the correct credentials for the environment

### "Access denied"

- Make sure the Gmail API is enabled for your project
- Verify the OAuth scopes are correct

### Emails not syncing

- Check that your Gmail account has granted all requested permissions
- Verify the API calls are working by checking the browser network tab
- Ensure your access token hasn't expired

## API Scopes Used

The app requests the following Gmail permissions:

- `gmail.readonly` - Read emails from your Gmail account
- `gmail.modify` - Mark emails as read/unread (for processing status)

These are the minimum required permissions for email processing functionality.
