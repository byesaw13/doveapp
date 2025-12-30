import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards-api';
import { getJobById, updateJob } from '@/lib/api/jobs';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/tech/jobs/[id] - Get a single assigned job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    const { data, error } = await getJobById(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      id
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Access denied') ? 403 : 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/tech/jobs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/tech/jobs/[id] - Update an assigned job (limited fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = await createRouteHandlerClient();
    const body = await request.json();
    const { id } = await params;

    // Techs can only update specific fields (status, notes)
    const allowedUpdates: any = {};
    if (body.status !== undefined) allowedUpdates.status = body.status;
    if (body.notes !== undefined) allowedUpdates.notes = body.notes;
    if (body.internal_notes !== undefined)
      allowedUpdates.internal_notes = body.internal_notes;

    const { data, error } = await updateJob(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      id,
      allowedUpdates
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Access denied') ? 403 : 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PATCH /api/tech/jobs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
