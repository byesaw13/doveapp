import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: connectionId } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the Gmail connection (only if it belongs to the user)
    const { error } = await supabase
      .from('gmail_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting Gmail connection:', error);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/gmail/connections/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: connectionId } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger manual sync for this connection
    // This would typically call the Gmail sync worker
    // For now, we'll just update the sync status

    const { error } = await supabase
      .from('gmail_connections')
      .update({
        sync_status: 'active',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating sync status:', error);
      return NextResponse.json(
        { error: 'Failed to start sync' },
        { status: 500 }
      );
    }

    // TODO: Actually trigger the sync worker here
    // await triggerGmailSync(connectionId);

    return NextResponse.json({
      success: true,
      message: 'Sync started successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/gmail/connections/[id]/sync:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
