import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';

interface TodayStats {
  jobsScheduled: number;
  jobsCompleted: number;
  invoicesDue: number;
  invoicesOverdue: number;
  paymentsReceived: number;
  newLeads: number;
  urgentJobs: number;
}

/**
 * GET /api/admin/today/stats - Get today's dashboard statistics
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayISOString = today.toISOString().split('T')[0];

    // Parallel queries for better performance
    const [
      jobsScheduledResult,
      jobsCompletedResult,
      invoicesDueResult,
      invoicesOverdueResult,
      paymentsResult,
      leadsResult,
      urgentJobsResult,
    ] = await Promise.all([
      // Jobs scheduled for today
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('service_date', todayISOString),

      // Jobs completed today
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString()),

      // Invoices due today
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('due_date', todayISOString)
        .eq('status', 'sent'),

      // Overdue invoices
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .lt('due_date', todayISOString)
        .neq('status', 'paid'),

      // Payments received today
      supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString()),

      // New leads today
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString()),

      // Urgent jobs (high priority, not completed)
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'urgent')
        .neq('status', 'completed'),
    ]);

    perfLogger.incrementQueryCount();

    // Calculate payment total
    const paymentsReceived =
      paymentsResult.data?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;

    const stats: TodayStats = {
      jobsScheduled: jobsScheduledResult.count || 0,
      jobsCompleted: jobsCompletedResult.count || 0,
      invoicesDue: invoicesDueResult.count || 0,
      invoicesOverdue: invoicesOverdueResult.count || 0,
      paymentsReceived,
      newLeads: leadsResult.count || 0,
      urgentJobs: urgentJobsResult.count || 0,
    };

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      {
        date: todayISOString,
        stats,
        performance: {
          duration: metrics.duration,
          queryCount: metrics.queryCount,
        },
      },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in today stats:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during stats calculation' },
      { status: 500 }
    );
  }
}
