import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/square/oauth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/clients?error=square_auth_failed&message=${error}`
    );
  }

  // Validate code is present
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/clients?error=missing_code`
    );
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);

    // Store tokens in Supabase
    const { error: dbError } = await supabase
      .from('square_connections')
      .upsert({
        merchant_id: tokenData.merchantId,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: tokenData.expiresAt,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Error storing Square tokens:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/clients?error=db_error`
      );
    }

    // Redirect back to clients page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/clients?square_connected=true`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/clients?error=oauth_failed`
    );
  }
}
