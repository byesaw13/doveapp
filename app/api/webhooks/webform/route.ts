// Website lead form webhook.
// Accepts JSON from the public form, normalizes it, and stores it.
import { NextRequest, NextResponse } from 'next/server';
import { saveNormalizedMessage } from '@/lib/messaging/saveNormalizedMessage';
import type { NormalizedMessage } from '@/lib/messaging/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse the JSON body from the form submission.
    const body = await req.json();

    // Convert the form payload into the shared message shape.
    const normalized: NormalizedMessage = {
      channel: 'webform',
      direction: 'incoming',
      externalId: body.formSubmissionId || undefined,
      customer: {
        fullName: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
      },
      messageText: body.message || 'New lead from website form',
      attachments: [],
      rawPayload: body,
      receivedAt: new Date().toISOString(),
    };

    // Persist and kick off AI processing.
    await saveNormalizedMessage(normalized);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webform webhook error', error);
    return NextResponse.json({ error: 'Failed to save lead message' }, { status: 500 });
  }
}
