import { NextRequest, NextResponse } from 'next/server';
import {
  createEmailAccount,
  getEmailAccounts,
  updateEmailAccount,
} from '@/lib/db/email';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// POST /api/auth/google/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    console.log('OAuth callback received');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Code present:', !!code);
    console.log('Error present:', !!error);

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/email-review?error=oauth_failed', request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/email-review?error=no_code', request.url)
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(
        new URL('/email-review?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user profile information
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(
        new URL('/email-review?error=profile_fetch_failed', request.url)
      );
    }

    const profile = await profileResponse.json();

    // Create or update email account in database
    console.log('Creating/updating email account for:', profile.email);

    // Check if account already exists
    const existingAccounts = await getEmailAccounts();
    const existingAccount = existingAccounts.find(
      (acc: any) => acc.email_address === profile.email
    );

    let emailAccount;
    if (existingAccount) {
      // Update existing account
      console.log('Updating existing account');
      emailAccount = await updateEmailAccount(existingAccount.id, {
        gmail_refresh_token: tokenData.refresh_token,
        gmail_access_token: tokenData.access_token,
        token_expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        is_active: true,
      });
    } else {
      // Create new account
      console.log('Creating new account');
      emailAccount = await createEmailAccount({
        email_address: profile.email,
        gmail_refresh_token: tokenData.refresh_token,
        gmail_access_token: tokenData.access_token,
        token_expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        is_active: true,
      });
    }
    console.log('Email account processed:', emailAccount);

    // Redirect back to email review page with success
    console.log('Redirecting to success page');
    return NextResponse.redirect(
      new URL('/email-review?success=connected', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/email-review?error=server_error', request.url)
    );
  }
}
