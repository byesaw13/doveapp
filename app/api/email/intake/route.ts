// Gmail intake endpoint that turns parsed Gmail payloads into normalized messages.
// Intended to be called by the Gmail worker after it parses a message.
//
// WORKFLOW:
//   1. Gmail sync worker (TODO: implement) fetches emails using credentials from gmail_connections table
//   2. Worker parses email (sender, subject, body, attachments)
//   3. Worker POSTs parsed data to this endpoint
//   4. This endpoint normalizes the data and routes it to the unified inbox via saveNormalizedMessage()
//
// CURRENT STATUS: Endpoint is ready but no worker exists yet to call it.
import { NextRequest, NextResponse } from 'next/server';
import {
  gmailToNormalizedMessage,
  type ParsedGmail,
} from '@/lib/messaging/fromGmail';
import { saveNormalizedMessage } from '@/lib/messaging/saveNormalizedMessage';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Normalize attachments shape and guard required fields.
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!body.fromEmail || !body.messageId || !body.subject) {
      return NextResponse.json(
        { error: 'fromEmail, messageId, and subject are required' },
        { status: 400 }
      );
    }

    const parsed: ParsedGmail = {
      fromName: body.fromName,
      fromEmail: body.fromEmail,
      subject: body.subject,
      bodyText: body.bodyText || '',
      messageId: body.messageId,
      attachments: attachments.map((attachment: any) => ({
        downloadUrl: attachment.downloadUrl,
        mimeType: attachment.mimeType || 'application/octet-stream',
        filename: attachment.filename,
      })),
    };

    const normalized = gmailToNormalizedMessage(parsed);
    await saveNormalizedMessage(normalized);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Gmail intake error', error);
    return NextResponse.json(
      { error: 'Failed to process Gmail message' },
      { status: 500 }
    );
  }
}
