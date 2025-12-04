import { NextRequest, NextResponse } from 'next/server';
import {
  getEstimate,
  updateEstimate,
  deleteEstimate,
  sendEstimate,
  acceptEstimate,
  declineEstimate,
  convertEstimateToJob,
} from '@/lib/db/estimates';

// GET /api/estimates/[id] - Get estimate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const estimate = await getEstimate(id);

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// PUT /api/estimates/[id] - Update estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const estimate = await updateEstimate(id, body);
    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    );
  }
}

// PATCH /api/estimates/[id] - Partially update estimate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const estimate = await updateEstimate(id, body);
    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id] - Delete estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEstimate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    );
  }
}

// POST /api/estimates/[id] - Special actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send':
        const sent = await sendEstimate(id);
        return NextResponse.json(sent);

      case 'accept':
        const accepted = await acceptEstimate(id);
        return NextResponse.json(accepted);

      case 'decline':
        const { reason } = body;
        const declined = await declineEstimate(id, reason);
        return NextResponse.json(declined);

      case 'convert':
        const { job_id } = body;
        if (!job_id) {
          return NextResponse.json(
            { error: 'job_id is required' },
            { status: 400 }
          );
        }
        const converted = await convertEstimateToJob(id, job_id);
        return NextResponse.json(converted);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing estimate action:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
