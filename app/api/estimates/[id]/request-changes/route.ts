import { NextRequest, NextResponse } from 'next/server';
import { getEstimate } from '@/lib/db/estimates';

interface RequestChangesRequest {
  description: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;
    const body: RequestChangesRequest = await request.json();

    if (!estimateId) {
      return NextResponse.json(
        { error: 'Estimate ID is required' },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Load estimate
    const estimate = await getEstimate(estimateId);
    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Log the change request (could be stored in sent_history or a separate table)
    const changeRequest = {
      type: 'changes_requested',
      description: body.description.trim(),
      requestedAt: new Date().toISOString(),
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    };

    // TODO: Send email notification to business about change request
    console.log('Change request for estimate', estimateId, changeRequest);

    // For now, just log - in production, send email to business
    // await sendEmailToBusiness(estimate, body.description);

    return NextResponse.json({
      success: true,
      message: 'Change request submitted successfully',
    });
  } catch (error) {
    console.error('Error requesting changes:', error);
    return NextResponse.json(
      { error: 'Failed to request changes' },
      { status: 500 }
    );
  }
}
