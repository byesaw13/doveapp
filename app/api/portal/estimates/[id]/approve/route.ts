import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { logActivity } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireCustomerContext(request);
    const supabase = createAuthenticatedClient(request);
    const estimateId = params.id;

    // Verify ownership
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('customer_id, status')
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    if (estimate.customer_id !== context.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (estimate.status !== 'sent') {
      return NextResponse.json(
        { error: 'Estimate cannot be approved' },
        { status: 400 }
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from('estimates')
      .update({ status: 'approved' })
      .eq('id', estimateId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve estimate' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity(
      supabase,
      context.userId,
      'CUSTOMER',
      'estimate',
      estimateId,
      'approved'
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error approving estimate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
