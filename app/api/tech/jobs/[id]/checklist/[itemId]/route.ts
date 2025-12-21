import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = createClient();
    const { id: jobId, itemId } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete checklist item (only if it belongs to the job)
    const { error } = await supabase
      .from('job_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error deleting checklist item:', error);
      return NextResponse.json(
        { error: 'Failed to delete checklist item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in DELETE /api/tech/jobs/[id]/checklist/[itemId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
