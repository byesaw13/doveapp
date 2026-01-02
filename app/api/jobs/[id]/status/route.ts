import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canAccessTech } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import type { JobStatus } from '@/types/job';

interface UpdateJobStatusRequest {
  status: JobStatus;
  reason?: string;
}

const ALLOWED_STATUSES: JobStatus[] = [
  'draft',
  'quote',
  'scheduled',
  'in_progress',
  'completed',
  'invoiced',
  'cancelled',
];

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ['quote', 'scheduled', 'cancelled'],
  quote: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: ['invoiced'],
  invoiced: [],
  cancelled: [],
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateJobId(id: string): boolean {
  return UUID_REGEX.test(id);
}

function validateReason(reason?: string): string | null {
  if (!reason) return null;
  const trimmed = reason.trim();
  if (trimmed.length > 500) return null;
  return trimmed;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body: UpdateJobStatusRequest = await request.json();

    if (!jobId || !validateJobId(jobId)) {
      return NextResponse.json(
        { error: 'Valid job ID (UUID) is required' },
        { status: 400 }
      );
    }

    const validatedReason = validateReason(body.reason);
    if (body.reason !== undefined && validatedReason === null) {
      return NextResponse.json(
        { error: 'Reason must be a string up to 500 characters' },
        { status: 400 }
      );
    }

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Get session and account context
    const context = await requireAccountContext(request);
    if (!canAccessTech(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createRouteHandlerClient();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, assigned_tech_id, account_id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (context.role === 'TECH' && job.assigned_tech_id !== context.userId) {
      return NextResponse.json(
        { error: 'Job not assigned to this technician' },
        { status: 403 }
      );
    }

    const currentStatus = job.status;

    if (
      typeof currentStatus !== 'string' ||
      !(currentStatus in VALID_TRANSITIONS)
    ) {
      return NextResponse.json(
        { error: `Invalid job status value: ${String(currentStatus)}` },
        { status: 400 }
      );
    }

    const allowedNext = VALID_TRANSITIONS[currentStatus as JobStatus];

    const nextStatus = body.status;
    if (typeof nextStatus !== 'string' || !(nextStatus in VALID_TRANSITIONS)) {
      return NextResponse.json(
        { error: `Invalid next status value: ${String(nextStatus)}` },
        { status: 400 }
      );
    }

    if (!allowedNext.includes(nextStatus as JobStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, string | boolean> = {
      status: body.status,
    };

    if (body.status === 'completed') {
      updatePayload.ready_for_invoice = true;
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error('Failed to update job status');
    }

    // Append audit event to job_notes
    const auditNote = `Status changed from ${job.status} to ${body.status}${validatedReason ? `: ${validatedReason}` : ''}`;
    const { data: noteData, error: noteError } = await supabase
      .from('job_notes')
      .insert({
        job_id: jobId,
        technician_id: context.userId,
        note: auditNote,
        account_id: context.accountId,
      })
      .select('id')
      .single();

    if (noteError) {
      console.error('Failed to create audit note:', noteError);
      // Continue anyway, as status update succeeded
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      audit_note_id: noteData?.id || null,
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update job status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
