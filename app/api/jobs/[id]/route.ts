import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import { validateRequest, updateJobSchema } from '@/lib/api/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAuthenticatedClient(request);

    // Validate request body
    const { data, error: validationError } = await validateRequest(
      request,
      updateJobSchema
    );
    if (validationError) return validationError;

    const updateData: any = {};
    if (data!.status) updateData.status = data!.status;
    if (data!.title) updateData.title = data!.title;
    if (data!.description !== undefined)
      updateData.description = data!.description;

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', context.accountId) // Security: only update own account jobs
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return errorResponse(error, 'Failed to update job');
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return unauthorizedResponse();
  }
}
