import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(
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

    // Get current item state
    const { data: item, error: fetchError } = await supabase
      .from('job_checklist_items')
      .select('is_completed')
      .eq('id', itemId)
      .eq('job_id', jobId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      );
    }

    // Toggle the completion state
    const { error } = await supabase
      .from('job_checklist_items')
      .update({
        is_completed: !item.is_completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error toggling checklist item:', error);
      return NextResponse.json(
        { error: 'Failed to toggle checklist item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in PATCH /api/tech/jobs/[id]/checklist/[itemId]/toggle:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
