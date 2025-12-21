import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  RATE_LIMITS,
  getRateLimitHeaders,
} from '@/lib/rate-limit';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// GET /api/auth/google - Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  // Apply rate limiting to prevent OAuth abuse
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const rateLimit = checkRateLimit(`oauth:${ip}`, RATE_LIMITS.AUTH);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many OAuth attempts',
        message: 'Please try again later',
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
      }
    );
  }

  // Debug: Check if environment variables are loaded
  // Debug logging for OAuth setup
  console.warn(
    '⚠️  Make sure this EXACTLY matches your Google Cloud Console redirect URI!'
  );
  console.log(
    'Expected redirect URI: http://localhost:3000/api/auth/google/callback'
  );
  console.warn(
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
