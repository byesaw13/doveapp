import { NextRequest, NextResponse } from 'next/server';
import { getEstimate, updateEstimate } from '@/lib/db/estimates';
import { createActivity } from '@/lib/db/activities';

interface DeclineEstimateRequest {
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;
    const body: DeclineEstimateRequest = await request.json();

    if (!estimateId) {
      return NextResponse.json(
        { error: 'Estimate ID is required' },
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

    // Update estimate with decline info
    const declineInfo = {
      declinedAt: new Date().toISOString(),
      reason: body.reason?.trim() || null,
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    };

    await updateEstimate(estimateId, {
      status: 'declined',
      decline_info: declineInfo,
    });

    // Log activity
    await createActivity({
      client_id: estimate.client_id!,
      activity_type: 'estimate_declined',
      title: `Estimate ${estimate.estimate_number} declined`,
      description: body.reason
        ? `Declined: ${body.reason}`
        : 'Estimate declined by client',
      related_id: estimateId,
      related_type: 'estimate',
    });

    return NextResponse.json({
      success: true,
      message: 'Estimate declined successfully',
    });
  } catch (error) {
    console.error('Error declining estimate:', error);
    return NextResponse.json(
      { error: 'Failed to decline estimate' },
      { status: 500 }
    );
  }
}
