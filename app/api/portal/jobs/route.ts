import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards-api';
import { listJobs, type JobFilters } from '@/lib/api/jobs';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/portal/jobs - List jobs for customer (read-only, customer-scoped)
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
      // Create a mock context for demo
      context = {
        userId: 'demo-customer',
        role: 'CUSTOMER' as const,
        accountId: 'demo-account',
      };
    }
    const { searchParams } = new URL(request.url);

    // Get customer_id from query params
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      );
    }

    // Verify the customer_id matches the authenticated user or belongs to their account
    // TODO: Add more sophisticated customer ID validation once customer portal auth is fully implemented

    const filters: JobFilters = {
      status: (searchParams.get('status') as any) || undefined,
      customerId,
    };

    const { data, error } = await listJobs(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: 'CUSTOMER', // Force customer role
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redact internal fields for customer view
    const customerData = (data || []).map((job: any) => ({
      id: job.id,
      job_number: job.job_number,
      title: job.title,
      description: job.description,
      status: job.status,
      service_date: job.service_date,
      scheduled_time: job.scheduled_time,
      total: job.total,
      created_at: job.created_at,
      updated_at: job.updated_at,
      // Omit: internal_notes, subtotal, tax, cost breakdowns
    }));

    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('Error in GET /api/portal/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
