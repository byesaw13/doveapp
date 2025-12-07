import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface SidebarPerformanceData {
  todayJobsCount: number;
  todayJobsScheduled: number;
  weekRevenue: number;
  weekRevenueTarget: number;
  outstandingInvoices: number;
  outstandingInvoicesAmount: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [todayJobsResult, weekJobsResult, invoicesResult] = await Promise.all(
      [
        // Today's jobs
        supabase.from('jobs').select('id, status').eq('service_date', today),

        // This week's completed jobs for revenue
        supabase
          .from('jobs')
          .select('total, amount_paid')
          .eq('status', 'completed')
          .gte('updated_at', weekStart),

        // Outstanding invoices (jobs with unpaid balance)
        supabase
          .from('jobs')
          .select('total, amount_paid')
          .in('status', ['completed', 'in_progress'])
          .gt('total', 0),
      ]
    );

    // Calculate today's jobs
    const todayJobs = todayJobsResult.data || [];
    const todayJobsScheduled = todayJobs.filter(
      (j) => j.status === 'scheduled' || j.status === 'in_progress'
    ).length;

    // Calculate week revenue
    const weekJobs = weekJobsResult.data || [];
    const weekRevenue = weekJobs.reduce(
      (sum, job) => sum + (Number(job.total) || 0),
      0
    );

    // Calculate outstanding invoices
    const allJobs = invoicesResult.data || [];
    const unpaidJobs = allJobs.filter(
      (j) => Number(j.total) > (Number(j.amount_paid) || 0)
    );
    const outstandingInvoicesAmount = unpaidJobs.reduce(
      (sum, job) => sum + (Number(job.total) - (Number(job.amount_paid) || 0)),
      0
    );

    // Weekly target is configurable, default to $5000
    const weekRevenueTarget = 5000;

    const performance: SidebarPerformanceData = {
      todayJobsCount: todayJobs.length,
      todayJobsScheduled,
      weekRevenue,
      weekRevenueTarget,
      outstandingInvoices: unpaidJobs.length,
      outstandingInvoicesAmount,
    };

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Error fetching sidebar performance data:', error);
    return NextResponse.json(
      {
        todayJobsCount: 0,
        todayJobsScheduled: 0,
        weekRevenue: 0,
        weekRevenueTarget: 5000,
        outstandingInvoices: 0,
        outstandingInvoicesAmount: 0,
      },
      { status: 200 }
    );
  }
}
