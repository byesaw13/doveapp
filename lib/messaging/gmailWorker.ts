// Gmail Sync Worker - First Version
//
// PURPOSE:
// This worker fetches unread emails from connected Gmail accounts and feeds them
// into the unified inbox using the existing normalized message pipeline.
//
// PRODUCTION DEPLOYMENT:
// This function is designed to be called by:
//   - Vercel Cron (every 5-10 minutes)
//   - Manual trigger via /api/email/sync
//   - Scheduled background job
//
// CURRENT LIMITATIONS:
// - Token refresh logic is stubbed (TODO: implement full OAuth token refresh)
// - Max 50 emails per account per sync to prevent overload
// - Only fetches emails from last 24 hours
// - Basic error handling (individual email failures don't stop the batch)
//
// DATA FLOW:
//   1. Fetch active gmail_connections from database
//   2. For each connection, use access_token to call Gmail API
//   3. Fetch unread emails (max 50, last 24 hours)
//   4. Parse each email into ParsedGmail format
//   5. Transform to NormalizedMessage via gmailToNormalizedMessage()
//   6. Save to unified inbox via saveNormalizedMessage()
//   7. Mark email as read in Gmail
//   8. Return summary of synced messages

import { supabase } from '@/lib/supabase';
import { gmailToNormalizedMessage, type ParsedGmail } from './fromGmail';
import { saveNormalizedMessage } from './saveNormalizedMessage';

// Gmail API types
interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; attachmentId?: string };
      filename?: string;
      headers?: Array<{ name: string; value: string }>;
    }>;
    body?: { data?: string };
  };
  internalDate?: string;
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Safety limits
const MAX_EMAILS_PER_ACCOUNT = 50;
const HOURS_TO_SYNC = 24;

/**
 * Main sync function - fetches unread emails from all active Gmail connections
 * and routes them to the unified inbox.
 */
export async function syncGmailToInbox(): Promise<{
  totalSynced: number;
  errors: string[];
}> {
  console.log('🔄 Starting Gmail sync worker...');

  let totalSynced = 0;
  const errors: string[] = [];

  try {
    // Step 1: Fetch all active Gmail connections
    const { data: connections, error: connectionsError } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('is_active', true);

    if (connectionsError) {
      console.error('Failed to fetch Gmail connections:', connectionsError);
      errors.push(`Database error: ${connectionsError.message}`);
      return { totalSynced: 0, errors };
    }

    if (!connections || connections.length === 0) {
      console.log('📭 No active Gmail connections found');
      return { totalSynced: 0, errors: [] };
    }

    console.log(`📬 Found ${connections.length} active Gmail connection(s)`);

    // Step 2: Process each connection
    for (const connection of connections) {
      try {
        console.log(`📧 Syncing emails for: ${connection.email_address}`);

        // TODO: Check if access_token is expired and refresh if needed
        // For now, we assume the token is valid. Token refresh logic should:
        //   1. Check if token_expires_at < now
        //   2. Use refresh_token to get new access_token from Google
        //   3. Update gmail_connections table with new token and expiry
        //   4. See: https://developers.google.com/identity/protocols/oauth2/web-server#offline

        const synced = await syncAccountEmails(
          connection.email_address,
          connection.access_token
        );

        totalSynced += synced;
        console.log(
          `✅ Synced ${synced} email(s) from ${connection.email_address}`
        );
      } catch (accountError) {
        const errorMsg = `Failed to sync ${connection.email_address}: ${accountError}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        // Continue with other accounts even if one fails
      }
    }

    console.log(`🎉 Gmail sync complete. Total synced: ${totalSynced}`);
    return { totalSynced, errors };
  } catch (error) {
    console.error('❌ Gmail sync worker failed:', error);
    errors.push(`Worker error: ${error}`);
    return { totalSynced, errors };
  }
}

/**
 * Sync emails for a single Gmail account
 */
async function syncAccountEmails(
  emailAddress: string,
  accessToken: string
): Promise<number> {
  let syncedCount = 0;

  // Step 1: Build query for unread emails from last 24 hours
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - HOURS_TO_SYNC);
  const cutoffSeconds = Math.floor(cutoffTime.getTime() / 1000);

  // Gmail search query: unread emails newer than cutoff, excluding chats
  const query = `is:unread after:${cutoffSeconds} -in:chat`;

  // Step 2: List unread messages
  const listUrl = new URL(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages'
  );
  listUrl.searchParams.set('q', query);
  listUrl.searchParams.set('maxResults', MAX_EMAILS_PER_ACCOUNT.toString());

  const listResponse = await fetch(listUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(
      `Gmail API list failed: ${listResponse.status} - ${errorText}`
    );
  }

  const listData: GmailListResponse = await listResponse.json();

  if (!listData.messages || listData.messages.length === 0) {
    console.log(`📪 No unread emails found for ${emailAddress}`);
    return 0;
  }

  console.log(
    `📬 Found ${listData.messages.length} unread email(s) for ${emailAddress}`
  );

  // Step 3: Fetch and process each message
  for (const messageRef of listData.messages) {
    try {
      const messageId = messageRef.id;

      // Fetch full message details
      const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
      const messageResponse = await fetch(messageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!messageResponse.ok) {
        console.error(
          `Failed to fetch message ${messageId}: ${messageResponse.status}`
        );
        continue; // Skip this message, continue with others
      }

      const message: GmailMessage = await messageResponse.json();

      // Step 4: Parse the email
      const parsed = parseGmailMessage(message);

      // Step 5: Transform and save to unified inbox
      const normalized = gmailToNormalizedMessage(parsed);
      await saveNormalizedMessage(normalized);

      // Step 6: Mark as read in Gmail
      await markAsRead(messageId, accessToken);

      syncedCount++;
      console.log(`✉️  Synced email: ${parsed.subject.substring(0, 50)}...`);
    } catch (messageError) {
      console.error(
        `Failed to process message ${messageRef.id}:`,
        messageError
      );
      // Continue with next message
    }
  }

  return syncedCount;
}

/**
 * Parse Gmail API message into ParsedGmail format
 */
function parseGmailMessage(message: GmailMessage): ParsedGmail {
  const headers = message.payload?.headers || [];

  // Extract headers
  const fromHeader =
    headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
  const subjectHeader =
    headers.find((h) => h.name.toLowerCase() === 'subject')?.value ||
    '(No Subject)';

  // Parse From header: "John Doe <john@example.com>" -> name and email
  const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  const fromName = fromMatch
    ? fromMatch[1].trim().replace(/^["']|["']$/g, '')
    : '';
  const fromEmail = fromMatch ? fromMatch[2].trim() : fromHeader.trim();

  // Extract plain text body
  const bodyText = extractPlainTextBody(message);

  // Parse attachments (simplified - just get filenames and types)
  const attachments = extractAttachments(message);

  return {
    fromName: fromName || undefined,
    fromEmail,
    subject: subjectHeader,
    bodyText,
    messageId: message.id,
    attachments,
  };
}

/**
 * Extract plain text body from Gmail message
 */
function extractPlainTextBody(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return '';

  // Check if body is directly in payload
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Check parts for text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }

    // Fallback: look for text/html and strip tags (basic)
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        // Very basic HTML stripping - just remove tags
        return html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  // Last resort: use snippet
  return message.snippet || '';
}

/**
 * Extract attachment metadata from Gmail message
 * Note: For now we just record attachment info without downloading.
 * TODO: Implement attachment download if needed for unified inbox.
 */
function extractAttachments(message: GmailMessage): ParsedGmail['attachments'] {
  const attachments: ParsedGmail['attachments'] = [];
  const payload = message.payload;

  if (!payload?.parts) return attachments;

  for (const part of payload.parts) {
    // Gmail attachments have filename and attachmentId
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        downloadUrl: `gmail-attachment://${message.id}/${part.body.attachmentId}`,
        mimeType: part.mimeType || 'application/octet-stream',
        filename: part.filename,
      });
    }
  }

  return attachments;
}

/**
 * Decode Gmail's base64url encoded strings
 */
function decodeBase64Url(data: string): string {
  try {
    // Gmail uses base64url encoding (- instead of +, _ instead of /)
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decode base64url:', error);
    return '';
  }
}

/**
 * Mark a Gmail message as read
 */
async function markAsRead(
  messageId: string,
  accessToken: string
): Promise<void> {
  const modifyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;

  const response = await fetch(modifyUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      removeLabelIds: ['UNREAD'],
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to mark message ${messageId} as read: ${response.status}`
    );
    // Don't throw - marking as read is not critical
  }
}
