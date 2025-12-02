import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/emails/actions - Perform actions on emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, emailId } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'mark_read':
        const { error: readError } = await supabase
          .from('emails_raw')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', emailId);

        if (readError) throw readError;

        return NextResponse.json({ success: true, message: 'Marked as read' });

      case 'mark_unread':
        const { error: unreadError } = await supabase
          .from('emails_raw')
          .update({
            is_read: false,
            read_at: null,
          })
          .eq('id', emailId);

        if (unreadError) throw unreadError;

        return NextResponse.json({
          success: true,
          message: 'Marked as unread',
        });

      case 'star':
        const { error: starError } = await supabase
          .from('emails_raw')
          .update({ is_starred: true })
          .eq('id', emailId);

        if (starError) throw starError;

        return NextResponse.json({ success: true, message: 'Starred' });

      case 'unstar':
        const { error: unstarError } = await supabase
          .from('emails_raw')
          .update({ is_starred: false })
          .eq('id', emailId);

        if (unstarError) throw unstarError;

        return NextResponse.json({ success: true, message: 'Unstarred' });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Use: mark_read, mark_unread, star, unstar',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing email action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
