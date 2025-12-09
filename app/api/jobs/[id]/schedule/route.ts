import { NextRequest, NextResponse } from 'next/server';
import { updateJobScheduling } from '@/lib/db/jobs';

interface ScheduleJobRequest {
  scheduledFor: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body: ScheduleJobRequest = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    await updateJobScheduling(jobId, {
      scheduledFor: body.scheduledFor,
    });

    return NextResponse.json({
      success: true,
      message: 'Job scheduling updated successfully',
    });
  } catch (error) {
    console.error('Error updating job scheduling:', error);
    return NextResponse.json(
      { error: 'Failed to update job scheduling' },
      { status: 500 }
    );
  }
}
