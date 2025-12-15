import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { z } from 'zod';

const updateVisitSchema = z
  .object({
    status: z.enum(['in_progress', 'completed']),
    notes: z.string().optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    // Parse and validate body
    const body = await request.json();
    const validation = updateVisitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }
    const { status, notes } = validation.data;

    // Check if visit exists and is assigned to this tech
    const { data: visit, error: fetchError } = await supabase
      .from('visits')
      .select('id, status, technician_id')
      .eq('id', id)
      .eq('account_id', context.accountId)
      .single();

    if (fetchError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    if (visit.technician_id !== context.userId) {
      return NextResponse.json(
        { error: 'Access denied: Not assigned to this visit' },
        { status: 403 }
      );
    }

    // Validate status transition
    let isValidTransition = false;
    if (status === 'in_progress' && visit.status === 'scheduled') {
      isValidTransition = true;
    } else if (status === 'completed' && visit.status === 'in_progress') {
      isValidTransition = true;
    }

    if (!isValidTransition) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${visit.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update the visit
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { error: updateError } = await supabase
      .from('visits')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('required') || error.message?.includes('access');
    if (!isAuthError) {
      console.error('Error in PATCH /api/tech/visits/[id]:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
