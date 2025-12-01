import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// GET /api/auth/google - Initiate Google OAuth flow
export async function GET() {
  // Debug: Check if environment variables are loaded
  // Debug logging for OAuth setup
  console.log('🔍 GOOGLE OAUTH DEBUG - Checking configuration');
  console.log('Current redirect URI in env:', GOOGLE_REDIRECT_URI);
  console.log(
    '⚠️  Make sure this EXACTLY matches your Google Cloud Console redirect URI!'
  );
  console.log('Client ID present:', !!GOOGLE_CLIENT_ID);
  console.log('Client Secret present:', !!GOOGLE_CLIENT_SECRET);
  console.log('Redirect URI:', GOOGLE_REDIRECT_URI);
  console.log(
    'Expected redirect URI: http://localhost:3000/api/auth/google/callback'
  );
  console.log(
    '⚠️  CRITICAL: Make sure this EXACTLY matches your Google Cloud Console redirect URI!'
  );
  console.log(
    "If they don't match, update your .env.local file or Google Cloud Console"
  );

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    console.error('Missing Google OAuth environment variables');
    return NextResponse.json(
      {
        error: 'Google OAuth not configured',
        details:
          'Please check your .env.local file has GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI set',
      },
      { status: 500 }
    );
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(authUrl.toString());
}
