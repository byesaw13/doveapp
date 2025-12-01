import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailAccounts,
  createEmailMessage,
  getEmailMessageByGmailId,
  processEmailWithAI,
} from '@/lib/db/email';
import { storeEmailRaw } from '@/lib/email-processing-pipeline';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// POST /api/gmail/sync - Sync emails from Gmail
export async function POST(request: NextRequest) {
  try {
    const { accountId, maxResults = 50 } = await request.json();

    // Get email account
    const accounts = await getEmailAccounts();
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

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

      // Update the account with new token
      // Note: In a real app, you'd update this in the database
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
        // Check if we already have this message
        const existingMessage = await getEmailMessageByGmailId(message.id);
        if (existingMessage) {
          console.log(`Skipping already processed message ${message.id}`);
          processedCount++;
          continue;
        }

        // Fetch full message details
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!messageResponse.ok) continue;

        const messageData = await messageResponse.json();

        // Extract email data
        const headers = messageData.payload.headers;
        const getHeader = (name: string) => {
          const header = headers.find(
            (h: { name: string; value: string }) =>
              h.name.toLowerCase() === name.toLowerCase()
          );
          return header ? header.value : null;
        };

        const subject = getHeader('Subject');
        const sender = getHeader('From');
        const recipient = getHeader('To');
        const receivedAt = getHeader('Date');

        // Extract body
        let bodyText = '';
        let bodyHtml = '';

        const extractBody = (part: {
          mimeType: string;
          body?: { data: string };
          parts?: Array<{
            mimeType: string;
            body?: { data: string };
            parts?: any[];
          }>;
        }) => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            bodyText = Buffer.from(part.body.data, 'base64').toString();
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            bodyHtml = Buffer.from(part.body.data, 'base64').toString();
          } else if (part.parts) {
            part.parts.forEach(extractBody);
          }
        };

        if (messageData.payload.parts) {
          messageData.payload.parts.forEach(extractBody);
        } else if (messageData.payload.body?.data) {
          bodyText = Buffer.from(
            messageData.payload.body.data,
            'base64'
          ).toString();
        }

        // Check for attachments
        const hasAttachments =
          messageData.payload.parts?.some(
            (part: any) => part.filename && part.filename.length > 0
          ) || false;

        // Determine labels
        const labels = messageData.labelIds || [];

        // Store in new intelligence pipeline (emails_raw)
        try {
          await storeEmailRaw(
            account.id,
            message.id,
            message.threadId,
            messageData
          );
          console.log(`📥 Stored email ${message.id} in intelligence pipeline`);
        } catch (storeError) {
          console.error(
            `Failed to store email ${message.id} in intelligence pipeline:`,
            storeError
          );
          // Continue - don't fail the sync
        }

        // Create email message record (backward compatibility)
        const emailMessage = await createEmailMessage({
          email_account_id: account.id,
          gmail_message_id: message.id,
          gmail_thread_id: message.threadId,
          subject,
          sender,
          recipient,
          received_at: receivedAt
            ? new Date(receivedAt).toISOString()
            : undefined,
          body_text: bodyText,
          body_html: bodyHtml,
          has_attachments: hasAttachments,
          labels,
          category: 'unreviewed',
          priority: 'normal',
          is_read: labels.includes('UNREAD') ? false : true,
          is_starred: labels.includes('STARRED'),
        });

        // Process for enrichment with AI (legacy system)
        try {
          await processEmailWithAI(emailMessage);
        } catch (processError) {
          console.error(
            `Failed to process email ${message.id} with legacy AI:`,
            processError
          );
          // Continue with other messages - don't fail the sync
        }

        processedCount++;
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
