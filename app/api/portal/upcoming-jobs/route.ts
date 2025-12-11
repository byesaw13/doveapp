import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    // Validate customer access
    const context = await requireCustomerContext(request, customerId);

    const supabase = createClient();

    // Get upcoming jobs for this customer
    const now = new Date();

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(
        `
        id,
        job_number,
        title,
        description,
        status,
        scheduled_for,
        service_address,
        assigned_tech_id,
        users!jobs_assigned_tech_id_fkey (
          full_name
        )
      `
      )
      .eq('customer_id', customerId)
      .gte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: jobs || [],
    });
  } catch (error) {
    console.error('Portal upcoming-jobs API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}
