import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatusWithValidation } from '@/lib/db/jobs';
import type { JobStatus } from '@/types/job';

interface UpdateJobStatusRequest {
  status: JobStatus;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body: UpdateJobStatusRequest = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    await updateJobStatusWithValidation(jobId, body.status);

    return NextResponse.json({
      success: true,
      message: `Job status updated to ${body.status}`,
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update job status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
