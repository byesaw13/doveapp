import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards-api';
import { getJobById } from '@/lib/api/jobs';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/portal/jobs/[id] - Get a single job for customer (read-only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireCustomerContext(request);
    const supabase = await createRouteHandlerClient();
    const { id: jobId } = await params;

    const { data, error } = await getJobById(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: 'CUSTOMER', // Force customer role
        supabase,
      },
      jobId
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Access denied') ? 403 : 404 }
      );
    }

    // Redact internal fields for customer view
    const customerData = {
      id: (data as any)?.id,
      job_number: (data as any)?.job_number,
      title: (data as any)?.title,
      description: (data as any)?.description,
      status: (data as any)?.status,
      service_date: (data as any)?.service_date,
      scheduled_time: (data as any)?.scheduled_time,
      total: (data as any)?.total,
      line_items: (data as any)?.line_items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
      created_at: (data as any)?.created_at,
      updated_at: (data as any)?.updated_at,
      // Omit: internal_notes, subtotal, tax, cost breakdowns, assigned_tech_id
    };

    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('Error in GET /api/portal/jobs/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
