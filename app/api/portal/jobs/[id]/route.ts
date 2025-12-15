import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { getJobById } from '@/lib/api/jobs';

/**
 * GET /api/portal/jobs/[id] - Get a single job for customer (read-only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireCustomerContext(request);
    const supabase = createAuthenticatedClient(request);

    const { data, error } = await getJobById(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: 'CUSTOMER', // Force customer role
        supabase,
      },
      params.id
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Access denied') ? 403 : 404 }
      );
    }

    // Redact internal fields for customer view
    const customerData = {
      id: data?.id,
      job_number: data?.job_number,
      title: data?.title,
      description: data?.description,
      status: data?.status,
      service_date: data?.service_date,
      scheduled_time: data?.scheduled_time,
      total: data?.total,
      line_items: data?.line_items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
      created_at: data?.created_at,
      updated_at: data?.updated_at,
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
