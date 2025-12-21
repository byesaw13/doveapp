import { NextRequest, NextResponse } from 'next/server';
import { getEstimate } from '@/lib/db/estimates';
import { sendChangeRequestEmail } from '@/lib/email';

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

    // Send email notification to business about change request
    const businessEmail = process.env.BUSINESS_EMAIL || 'admin@example.com'; // TODO: Get from business settings
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const estimateUrl = `${appUrl}/admin/estimates/${estimateId}`;

    await sendChangeRequestEmail({
      to: businessEmail,
      customerName:
        estimate.client?.first_name && estimate.client?.last_name
          ? `${estimate.client.first_name} ${estimate.client.last_name}`
          : 'Customer',
      estimateNumber: estimate.estimate_number,
      requestedChanges: body.description,
      estimateUrl,
    });

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
