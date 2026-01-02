import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { validateRequest, updateJobSchema } from '@/lib/api/validation';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import type { JobStatus } from '@/types/job';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['quote', 'scheduled', 'cancelled'],
  quote: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['invoiced'],
  invoiced: [],
  cancelled: [],
};

// GET /api/jobs/[id] - Get job details with line items and client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Fetch job with client and line items
    // Note: We explicitly specify the relationship name to avoid ambiguity.
    const { data: job, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients!jobs_client_id_fkey(*),
        line_items:job_line_items(*)
      `
      )
      .eq('id', id)
      .eq('account_id', context.accountId)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return errorResponse(error, 'Failed to fetch job');
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return unauthorizedResponse();
  }
}

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

    const supabase = await createRouteHandlerClient();

    // Validate request body
    const { data, error: validationError } = await validateRequest(
      request,
      updateJobSchema
    );
    if (validationError) return validationError;

    let currentStatus: JobStatus | null = null;
    if (data!.status) {
      const { data: currentJob, error: currentError } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', id)
        .eq('account_id', context.accountId)
        .single();

      if (currentError || !currentJob) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      currentStatus = currentJob.status as JobStatus;
      const allowedNext = VALID_TRANSITIONS[currentStatus];
      if (!allowedNext || !allowedNext.includes(data!.status as JobStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentStatus} to ${data!.status}`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data!.status) updateData.status = data!.status;
    if (data!.title) updateData.title = data!.title;
    if (data!.description !== undefined)
      updateData.description = data!.description;
    if (data!.assigned_tech_id !== undefined)
      updateData.assigned_tech_id = data!.assigned_tech_id;
    if (data!.status === 'completed') {
      updateData.ready_for_invoice = true;
    }

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

    if (currentStatus && data!.status && currentStatus !== data!.status) {
      const { error: noteError } = await supabase.from('job_notes').insert({
        job_id: id,
        technician_id: context.userId,
        note: `Status changed from ${currentStatus} to ${data!.status}`,
        account_id: context.accountId,
      });

      if (noteError) {
        console.warn('Failed to log status change note:', noteError);
      }
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return unauthorizedResponse();
  }
}
