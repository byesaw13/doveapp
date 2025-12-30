import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// DELETE /api/jobs/[id]/line-items/[itemId] - Delete a line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: jobId, itemId } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Verify job exists and belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify line item exists and belongs to this job
    const { data: lineItem, error: itemError } = await supabase
      .from('job_line_items')
      .select('id')
      .eq('id', itemId)
      .eq('job_id', jobId)
      .single();

    if (itemError || !lineItem) {
      return NextResponse.json(
        { error: 'Line item not found' },
        { status: 404 }
      );
    }

    // Delete the line item
    const { error } = await supabase
      .from('job_line_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting line item:', error);
      return errorResponse(error, 'Failed to delete line item');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting line item:', error);
    return unauthorizedResponse();
  }
}
