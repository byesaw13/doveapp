// Messages for a specific conversation.
// Returns the ordered thread so the UI can render the chat view.
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // conversation id is captured from the dynamic route segment.
    const { id: conversationId } = await context.params;

    // Pull the full thread oldest-first for natural reading order.
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch conversation messages', error);
      return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Unexpected conversation messages error', err);
    return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });
  }
}
