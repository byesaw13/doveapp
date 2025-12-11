// Update conversation status API
//
// PATCH /api/inbox/conversations/[id]/status
// Body: { status: 'open' | 'closed' }
//
// Updates the status of a conversation for inbox management.
// Used by the UI to mark conversations as done or reopen them.
//
// TODO: Add authentication - currently no auth for dev purposes.
// In production, ensure only authorized users can update conversation status.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !['open', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "open" or "closed"' },
        { status: 400 }
      );
    }

    // Update conversation status
    const { data, error } = await supabase
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, updated_at')
      .single();

    if (error) {
      console.error('Failed to update conversation status:', error);
      return NextResponse.json(
        { error: 'Failed to update conversation status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error('Conversation status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
