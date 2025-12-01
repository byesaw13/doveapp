// Send email API
// POST /api/emails/send - Send an email via Gmail API

import { NextRequest, NextResponse } from 'next/server';
import { getEmailAccounts } from '@/lib/db/email';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { to, cc, bcc, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Get the connected email account
    const accounts = await getEmailAccounts();
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No email account connected' },
        { status: 400 }
      );
    }

    const account = accounts[0]; // Use the first connected account

    // Refresh access token if needed
    let accessToken = account.gmail_access_token;
    if (
      account.token_expires_at &&
      new Date(account.token_expires_at) <= new Date()
    ) {
      if (!account.gmail_refresh_token) {
        return NextResponse.json(
          {
            error:
              'Refresh token not available. Please reconnect Gmail account.',
          },
          { status: 401 }
        );
      }

      // Refresh the token
      const refreshResponse = await fetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: account.gmail_refresh_token,
            grant_type: 'refresh_token',
          }),
        }
      );

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to refresh access token' },
          { status: 401 }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }

    // Create the email content
    const emailLines = [`To: ${to}`, `Subject: ${subject}`];

    if (cc) {
      emailLines.push(`Cc: ${cc}`);
    }

    if (bcc) {
      emailLines.push(`Bcc: ${bcc}`);
    }

    emailLines.push('', body);

    const emailContent = emailLines.join('\r\n');

    // Base64 encode the email
    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email via Gmail API
    const sendResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      console.error('Gmail API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email via Gmail API' },
        { status: 500 }
      );
    }

    const sendResult = await sendResponse.json();

    return NextResponse.json({
      success: true,
      messageId: sendResult.id,
      threadId: sendResult.threadId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
