import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// POST /api/gmail/manage - Manage emails (delete, archive, mark as read/unread)
export async function POST(request: NextRequest) {
  try {
    const { action, messageId, threadId } = await request.json();

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: action and messageId' },
        { status: 400 }
      );
    }

    // Get active Gmail connection from database
    const { data: connection, error: connectionError } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        {
          error:
            'Gmail not connected. Please connect your Gmail account first.',
        },
        { status: 401 }
      );
    }

    let accessToken = connection.access_token;

    // Check if token is expired and refresh if needed
    if (new Date(connection.token_expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');

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
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }),
        }
      );

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to refresh access token. Please reconnect Gmail.' },
          { status: 401 }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update the connection with new token
      const newExpiresAt = new Date(
        Date.now() + refreshData.expires_in * 1000
      ).toISOString();
      await supabase
        .from('gmail_connections')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      console.log('Access token refreshed and saved successfully');
    }

    // Set up Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let result;

    switch (action) {
      case 'delete':
        result = await gmail.users.messages.trash({
          userId: 'me',
          id: messageId,
        });
        break;

      case 'archive':
        // Archive by removing INBOX label
        result = await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['INBOX'],
          },
        });
        break;

      case 'mark_read':
        result = await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
        break;

      case 'mark_unread':
        result = await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['UNREAD'],
          },
        });
        break;

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Supported: delete, archive, mark_read, mark_unread',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      messageId,
      result: result.data,
    });
  } catch (error) {
    console.error('Error managing email:', error);

    // Handle specific Gmail API errors
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return NextResponse.json(
          { error: 'Access token expired. Please reconnect Gmail.' },
          { status: 401 }
        );
      }
      if (error.message.includes('insufficient_scope')) {
        return NextResponse.json(
          { error: 'Missing Gmail permissions. Please reconnect Gmail.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to manage email' },
      { status: 500 }
    );
  }
}
