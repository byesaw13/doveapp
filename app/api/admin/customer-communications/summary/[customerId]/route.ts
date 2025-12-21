import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';

/**
 * GET /api/admin/customer-communications/summary/[customerId] - Get communication summary for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { customerId } = await params;

    const { data, error } = await supabase.rpc(
      'get_customer_communication_summary',
      {
        customer_uuid: customerId,
      }
    );

    if (error) {
      console.error('Error getting communication summary:', error);
      return NextResponse.json(
        { error: 'Failed to get communication summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: data });
  } catch (error) {
    console.error('Error in communication summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
