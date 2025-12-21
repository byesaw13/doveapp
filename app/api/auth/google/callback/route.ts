import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// GET /api/auth/google/callback - Handle OAuth callback for Email Intelligence Engine
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');


    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/inbox?error=oauth_failed', request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/inbox?error=no_code', request.url)
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
        new URL('/inbox?error=token_exchange_failed', request.url)
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
        new URL('/inbox?error=profile_fetch_failed', request.url)
      );
    }

    const profile = await profileResponse.json();

    // Store Gmail connection in gmail_connections table.
    // This table holds OAuth credentials that will be used by a future Gmail sync worker to:
    //   1. Periodically fetch new emails from Gmail API
    //   2. Parse email content (sender, subject, body, attachments)
    //   3. POST to /api/email/intake to add emails to the unified inbox
    // The worker will need to refresh the access_token using refresh_token when it expires.

    // Calculate token expiration timestamp (Google typically returns expires_in: 3600 seconds)
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(); // Default to 1 hour

    const connectionData = {
      email_address: profile.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Use upsert to insert or update based on unique email_address constraint.
    // If the email already exists, update the tokens; otherwise create new row.
    const { error: upsertError } = await supabase
      .from('gmail_connections')
      .upsert(connectionData, {
        onConflict: 'email_address',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Error upserting Gmail connection:', upsertError);
      return NextResponse.redirect(
        new URL('/inbox?error=gmail_connection_failed', request.url)
      );
    }


    // Redirect to unified inbox with success flag.
    // TODO: Future enhancement - build a dedicated /emails page to manage Gmail connections.
    return NextResponse.redirect(
      new URL('/inbox?gmail=connected', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/inbox?error=server_error', request.url)
    );
  }
}
