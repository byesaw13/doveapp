import { NextRequest, NextResponse } from 'next/server';
import { getEstimate, updateEstimate } from '@/lib/db/estimates';

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
      reason: body.reason?.trim(),
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    };

    await updateEstimate(estimateId, {
      status: 'declined',
      decline_info: declineInfo,
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
