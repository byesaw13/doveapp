// Helper to convert parsed Gmail messages into the shared NormalizedMessage shape.
import type { NormalizedMessage } from './types';

// Minimal shape expected from the Gmail parser/worker.
export interface ParsedGmail {
  fromName?: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  messageId: string;
  attachments: Array<{
    downloadUrl: string;
    mimeType: string;
    filename?: string;
  }>;
}

// Transform parsed Gmail data into the normalized format used by the inbox.
export function gmailToNormalizedMessage(parsed: ParsedGmail): NormalizedMessage {
  return {
    channel: 'email',
    direction: 'incoming',
    externalId: parsed.messageId,
    customer: {
      fullName: parsed.fromName,
      email: parsed.fromEmail,
    },
    messageText: `Subject: ${parsed.subject}\n\n${parsed.bodyText}`,
    attachments: parsed.attachments.map((attachment) => ({
      url: attachment.downloadUrl,
      type: attachment.mimeType.startsWith('image') ? 'image' : 'file',
      filename: attachment.filename,
    })),
    rawPayload: parsed,
    receivedAt: new Date().toISOString(),
  };
}
