import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards-api';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = await createRouteHandlerClient();

    // Get all metrics in parallel for efficiency
    const [
      { data: activeJobs },
      { data: jobsToday },
      { data: jobsThisWeek },
      { data: unpaidInvoices },
      { data: outstandingAmount },
      { data: pendingEstimates },
      { data: newLeads7 },
      { data: newLeads30 },
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .in('status', ['scheduled', 'in_progress']),

      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .gte('service_date', new Date().toISOString().split('T')[0]),

      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .gte(
          'service_date',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        ),

      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .eq('status', 'sent'),

      supabase
        .from('invoices')
        .select('total')
        .eq('account_id', context.accountId)
        .eq('status', 'sent'),

      supabase
        .from('estimates')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .eq('status', 'sent'),

      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),

      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', context.accountId)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    const totalOutstanding =
      outstandingAmount?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    const metrics = {
      activeJobs: activeJobs || 0,
      jobsToday: jobsToday || 0,
      jobsThisWeek: jobsThisWeek || 0,
      unpaidInvoices: unpaidInvoices || 0,
      outstandingAmount: totalOutstanding,
      pendingEstimates: pendingEstimates || 0,
      newLeads7: newLeads7 || 0,
      newLeads30: newLeads30 || 0,
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error in GET /api/admin/kpi:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}
