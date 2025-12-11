// Twilio webhook handler for SMS and WhatsApp.
// Parses the form payload, normalizes it, saves it, and replies with empty TwiML.
import { NextRequest, NextResponse } from 'next/server';
import { saveNormalizedMessage } from '@/lib/messaging/saveNormalizedMessage';
import type { NormalizedMessage } from '@/lib/messaging/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Twilio posts x-www-form-urlencoded which Next exposes as formData().
    const formData = await req.formData();

    const from = String(formData.get('From') || '');
    const to = String(formData.get('To') || '');
    const body = String(formData.get('Body') || '');
    const numMedia = Number(formData.get('NumMedia') || '0');

    // Determine whether this is WhatsApp by the prefix Twilio sends.
    const isWhatsApp = from.startsWith('whatsapp:') || to.startsWith('whatsapp:');

    // Collect any media attachments so we can store them with the message.
    const attachments: NormalizedMessage['attachments'] = [];
    for (let i = 0; i < numMedia; i += 1) {
      const mediaUrl = String(formData.get(`MediaUrl${i}`) || '');
      const contentType = String(formData.get(`MediaContentType${i}`) || 'image');
      attachments.push({
        url: mediaUrl,
        type: contentType.startsWith('image') ? 'image' : 'file',
        filename: undefined,
      });
    }

    // Build the normalized shape shared by every channel.
    const normalized: NormalizedMessage = {
      channel: isWhatsApp ? 'whatsapp' : 'sms',
      direction: 'incoming',
      externalId: String(formData.get('SmsSid') || formData.get('MessageSid') || ''),
      customer: {
        phone: from.replace('whatsapp:', ''),
      },
      messageText: body,
      attachments,
      rawPayload: Object.fromEntries(formData.entries()),
      receivedAt: new Date().toISOString(),
    };

    // Save the message and let downstream processing handle the rest.
    await saveNormalizedMessage(normalized);

    // Twilio requires a valid XML response even if empty.
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Twilio webhook error', error);
    return new NextResponse('<Response></Response>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
