import { NextRequest, NextResponse } from 'next/server';
import { getEstimate, updateEstimate } from '@/lib/db/estimates';
import { createJobFromEstimate } from '@/lib/db/jobs';

interface ApproveEstimateRequest {
  clientName: string;
  clientSignature: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;
    const body: ApproveEstimateRequest = await request.json();

    if (!estimateId) {
      return NextResponse.json(
        { error: 'Estimate ID is required' },
        { status: 400 }
      );
    }

    if (!body.clientName?.trim() || !body.clientSignature?.trim()) {
      return NextResponse.json(
        { error: 'Client name and signature are required' },
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

    // Check if estimate is still valid
    const validUntil = new Date(estimate.valid_until);
    if (new Date() > validUntil) {
      return NextResponse.json(
        { error: 'Estimate has expired' },
        { status: 400 }
      );
    }

    // Update estimate with approval info
    const approvalInfo = {
      approvedAt: new Date().toISOString(),
      approvedBy: body.clientName.trim(),
      signature: body.clientSignature.trim(),
      ipAddress:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    };

    await updateEstimate(estimateId, {
      status: 'approved',
      approval_info: approvalInfo,
    });

    // Create job from approved estimate
    const job = await createJobFromEstimate(estimateId);

    return NextResponse.json({
      success: true,
      message: 'Estimate approved successfully',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error approving estimate:', error);
    return NextResponse.json(
      { error: 'Failed to approve estimate' },
      { status: 500 }
    );
  }
}
