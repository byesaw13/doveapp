import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Delete payment
    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      return errorResponse(error, 'Failed to delete payment');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return unauthorizedResponse();
  }
}
