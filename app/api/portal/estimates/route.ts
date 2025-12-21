import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import {
  listEstimates,
  getEstimateById,
  updateEstimate,
  type EstimateFilters,
} from '@/lib/api/estimates';

/**
 * GET /api/portal/estimates - List estimates for customer (read-only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireCustomerContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    const filters: EstimateFilters = {
      customerId: context.userId, // Always filter by customer
    };

    const { data, error } = await listEstimates(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: 'CUSTOMER',
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redact sensitive information for customer view
    const customerData = (data || []).map((estimate: any) => ({
      id: estimate.id,
      estimate_number: estimate.estimate_number,
      title: estimate.title,
      description: estimate.description,
      status: estimate.status,
      total: estimate.total,
      valid_until: estimate.valid_until,
      created_at: estimate.created_at,
      updated_at: estimate.updated_at,
      // Remove internal notes, cost breakdowns, etc.
    }));

    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('Error in GET /api/portal/estimates:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
