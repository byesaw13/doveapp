import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ messageId: string; attachmentIndex: string }> }
) {
  try {
    const supabase = createClient();
    const { messageId, attachmentIndex } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const index = parseInt(attachmentIndex);
    if (isNaN(index) || index < 0) {
      return NextResponse.json(
        { error: 'Invalid attachment index' },
        { status: 400 }
      );
    }

    // Get the message with attachments
    const { data: message, error: messageError } = await supabase
      .from('conversation_messages')
      .select('attachments, conversation_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', message.conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check attachments array bounds
    if (
      !message.attachments ||
      !Array.isArray(message.attachments) ||
      index >= message.attachments.length
    ) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    const attachment = message.attachments[index];
    if (!attachment || !attachment.url) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Fetch the attachment
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch attachment' },
          { status: 500 }
        );
      }

      const contentType =
        response.headers.get('content-type') ||
        attachment.type ||
        'application/octet-stream';
      const filename = attachment.filename || `attachment-${index + 1}`;

      // Return the attachment with proper headers
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      return new Response(response.body, {
        status: 200,
        headers,
      });
    } catch (fetchError) {
      console.error('Error fetching attachment:', fetchError);
      return NextResponse.json(
        { error: 'Failed to download attachment' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in attachment download:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
