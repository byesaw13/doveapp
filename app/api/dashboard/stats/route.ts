import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { unauthorizedResponse } from '@/lib/api-helpers';
import { memoryCache } from '@/lib/utils';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export async function GET(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    let cacheKey = 'dashboard-stats-demo';
    try {
      context = await requireAccountContext(request);
      supabase = await createRouteHandlerClient();
      cacheKey = `dashboard-stats-${context.accountId}`;
    } catch (error) {
      // For demo purposes, allow access without account context
      // Use a basic supabase client without auth
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    // Check cache first (5 minute TTL for dashboard stats per account)
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get counts in parallel for better performance
    const [
      clientsResult,
      propertiesResult,
      jobsResult,
      estimatesResult,
      leadsResult,
    ] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('estimates').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
    ]);

    // Check for errors
    const errors = [];
    if (clientsResult.error)
      errors.push(`clients: ${clientsResult.error.message}`);
    if (propertiesResult.error)
      errors.push(`properties: ${propertiesResult.error.message}`);
    if (jobsResult.error) errors.push(`jobs: ${jobsResult.error.message}`);
    if (estimatesResult.error)
      errors.push(`estimates: ${estimatesResult.error.message}`);
    if (leadsResult.error) errors.push(`leads: ${leadsResult.error.message}`);

    if (errors.length > 0) {
      console.error('Errors fetching counts:', errors);
      // Return zeros on error to prevent UI breakage
      return NextResponse.json({
        totalClients: 0,
        totalProperties: 0,
        totalJobs: 0,
        totalEstimates: 0,
        totalLeads: 0,
      });
    }

    // Get basic job data for revenue calculations
    const { data: jobs } = await supabase
      .from('jobs')
      .select('total, amount_paid, status')
      .limit(100); // Limit for performance

    const totalRevenue =
      jobs?.reduce(
        (sum, job) => sum + parseFloat(job.total?.toString() || '0'),
        0
      ) || 0;
    const totalPaid =
      jobs?.reduce(
        (sum, job) => sum + parseFloat(job.amount_paid?.toString() || '0'),
        0
      ) || 0;
    const totalOutstanding = totalRevenue - totalPaid;

    // Get recent jobs
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients!jobs_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(5);

    const stats = {
      totalClients: clientsResult.count || 0,
      totalProperties: propertiesResult.count || 0,
      totalJobs: jobsResult.count || 0,
      totalEstimates: estimatesResult.count || 0,
      totalLeads: leadsResult.count || 0,
      totalRevenue,
      totalOutstanding,
      recentJobs: recentJobs || [],
    };

    // Cache the result for 5 minutes
    memoryCache.set(cacheKey, stats, 5 * 60 * 1000);

    // TODO: Add account_id filtering once columns are fully migrated
    // For now, RLS policies will handle filtering based on user's account membership

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return unauthorizedResponse();
  }
}
