import { NextRequest, NextResponse } from 'next/server';
import { storeEmailRaw } from '@/lib/email-processing-pipeline';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// POST /api/gmail/sync - Sync emails from Gmail for Email Intelligence Engine
export async function POST(request: NextRequest) {
  try {
    // Parse request body safely - ignore any malformed data
    let requestData = {};
    try {
      const body = await request.text();
      if (body) {
        requestData = JSON.parse(body);
      }
    } catch (parseError) {
      // Ignore parse errors - use defaults
      console.log('Ignoring malformed request body, using defaults');
    }

    const { maxResults = 50 } = requestData as any;

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

    // Fetch emails from Gmail
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=-is:chat`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!gmailResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch emails from Gmail' },
        { status: 500 }
      );
    }

    const gmailData = await gmailResponse.json();
    const messages = gmailData.messages || [];

    let processedCount = 0;

    // Process each message
    for (const message of messages) {
      try {
        // Check if we already have this message in emails_raw
        // TODO: Add a check for existing emails_raw records

        // Fetch full message details
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!messageResponse.ok) continue;

        const messageData = await messageResponse.json();

        // Store in intelligence pipeline (emails_raw)
        try {
          await storeEmailRaw(message.id, message.threadId, messageData);
          console.log(`📥 Stored email ${message.id} in intelligence pipeline`);
          processedCount++;
        } catch (storeError) {
          console.error(
            `Failed to store email ${message.id} in intelligence pipeline:`,
            storeError
          );
          // Continue - don't fail the sync
        }
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);
        // Continue with other messages
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: messages.length,
    });
  } catch (error) {
    console.error('Error syncing Gmail messages:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to sync Gmail messages';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
