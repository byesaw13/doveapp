import { NextRequest, NextResponse } from 'next/server';
import { updateJobNotes } from '@/lib/db/jobs';

interface UpdateJobNotesRequest {
  internalNotes?: string;
  clientNotes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body: UpdateJobNotesRequest = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    await updateJobNotes(jobId, {
      internalNotes: body.internalNotes,
      clientNotes: body.clientNotes,
    });

    return NextResponse.json({
      success: true,
      message: 'Job notes updated successfully',
    });
  } catch (error) {
    console.error('Error updating job notes:', error);
    return NextResponse.json(
      { error: 'Failed to update job notes' },
      { status: 500 }
    );
  }
}
