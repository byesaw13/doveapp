import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// GET /api/auth/google/callback - Handle OAuth callback for Email Intelligence Engine
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
        new URL('/emails?error=oauth_failed', request.url)
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/emails?error=no_code', request.url)
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
        new URL('/emails?error=token_exchange_failed', request.url)
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
        new URL('/emails?error=profile_fetch_failed', request.url)
      );
    }

    const profile = await profileResponse.json();

    // Store Gmail connection in database for persistence
    console.log('Gmail OAuth successful for:', profile.email);

    const connectionData = {
      email_address: profile.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
      is_active: true,
    };

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('gmail_connections')
      .select('id')
      .eq('email_address', profile.email)
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('gmail_connections')
        .update(connectionData)
        .eq('id', existingConnection.id);

      if (updateError) {
        console.error('Error updating Gmail connection:', updateError);
        return NextResponse.redirect(
          new URL('/emails?error=connection_update_failed', request.url)
        );
      }
      console.log('Updated existing Gmail connection');
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('gmail_connections')
        .insert([connectionData]);

      if (insertError) {
        console.error('Error creating Gmail connection:', insertError);
        return NextResponse.redirect(
          new URL('/emails?error=connection_create_failed', request.url)
        );
      }
      console.log('Created new Gmail connection');
    }

    // Redirect back to emails page with success
    console.log('Redirecting to emails page with success');
    return NextResponse.redirect(
      new URL('/emails?success=connected', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/emails?error=server_error', request.url)
    );
  }
}
