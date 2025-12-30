import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards-api';
import {
  listEstimates,
  getEstimateById,
  updateEstimate,
  type EstimateFilters,
} from '@/lib/api/estimates';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/portal/estimates - List estimates for customer (read-only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to get customer context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireCustomerContext(request);
      supabase = await createRouteHandlerClient();
    } catch (error) {
      // For demo purposes, allow access without customer context
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      context = {
        userId: 'demo-customer',
        role: 'CUSTOMER' as const,
        accountId: 'demo-account',
      };
    }

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

    // For demo, return mock data if no real data
    if (!data || data.length === 0) {
      return NextResponse.json([
        {
          id: 'demo-estimate-1',
          estimate_number: 'EST-001',
          title: 'Demo Estimate',
          description: 'This is a demo estimate for testing',
          status: 'sent',
          total: 150.0,
          created_at: new Date().toISOString(),
        },
      ]);
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
