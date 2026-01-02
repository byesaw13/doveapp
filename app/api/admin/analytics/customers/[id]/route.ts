import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canViewReports } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import {
  calculateCustomerLifetimeValue,
  predictNextCustomerJob,
} from '@/lib/analytics/customer-analytics';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/admin/analytics/customers/[id] - Get detailed analytics for a specific customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and require reports permission
    const context = await requireAccountContext(request);
    if (!canViewReports(context.permissions)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Reports permission required' },
        { status: 403 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const { id: customerId } = await params;

    perfLogger.incrementQueryCount();

    // Get customer basic info
    const { data: customer, error: customerError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate lifetime value analytics
    const analytics = await calculateCustomerLifetimeValue(
      customerId,
      supabase
    );

    // Predict next job
    const nextPredictedJob = await predictNextCustomerJob(customerId, supabase);

    // Get detailed job history
    const { data: jobs } = await supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        status,
        total,
        created_at,
        service_date,
        invoices (
          id,
          status,
          total
        )
      `
      )
      .eq('client_id', customerId)
      .order('created_at', { ascending: false });

    // Get payment history
    const { data: payments } = await supabase
      .from('payments')
      .select(
        `
        id,
        amount,
        method,
        created_at,
        jobs!payments_job_id_fkey (
          title
        )
      `
      )
      .eq('job_id', jobs?.map((j) => j.id) || [])
      .order('created_at', { ascending: false });

    // Calculate additional metrics
    const completedJobs =
      jobs?.filter((job) => job.status === 'completed') || [];
    const totalPayments =
      payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const outstandingBalance =
      completedJobs.reduce((sum, job) => sum + (job.total || 0), 0) -
      totalPayments;

    const result = {
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.phone,
        company: customer.company_name,
        created_at: customer.created_at,
      },
      analytics: {
        ...analytics,
        nextPredictedJob,
        outstandingBalance,
        totalPayments,
      },
      jobHistory: jobs || [],
      paymentHistory: payments || [],
      insights: {
        preferredServices: calculatePreferredServices(jobs || []),
        averageJobValue: analytics.averageJobValue,
        paymentReliability: calculatePaymentReliability(
          jobs || [],
          payments || []
        ),
        satisfactionIndicators: calculateSatisfactionIndicators(jobs || []),
      },
    };

    const metrics = perfLogger.complete(200);
    return NextResponse.json(result, {
      headers: {
        'X-Response-Time': `${metrics.duration}ms`,
        'X-Query-Count': metrics.queryCount?.toString() || '0',
      },
    });
  } catch (error) {
    console.error('Error in customer analytics:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during analytics calculation' },
      { status: 500 }
    );
  }
}

// Helper functions for detailed analytics

function calculatePreferredServices(jobs: any[]): string[] {
  // Analyze job titles and descriptions to find common service types
  const serviceKeywords = {
    plumbing: ['plumb', 'faucet', 'drain', 'pipe', 'toilet', 'sink', 'water'],
    electrical: ['electr', 'outlet', 'switch', 'wire', 'light', 'circuit'],
    hvac: ['hvac', 'heat', 'air', 'furnace', 'ac', 'vent', 'duct'],
    painting: ['paint', 'wall', 'ceiling', 'color', 'brush', 'roller'],
    roofing: ['roof', 'shingle', 'gutter', 'leak', 'tile'],
    flooring: ['floor', 'tile', 'carpet', 'hardwood', 'laminate'],
  };

  const serviceCounts: Record<string, number> = {};

  jobs.forEach((job) => {
    const text = `${job.title} ${job.description || ''}`.toLowerCase();

    Object.entries(serviceKeywords).forEach(([service, keywords]) => {
      if (keywords.some((keyword) => text.includes(keyword))) {
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      }
    });
  });

  return Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([service]) => service);
}

function calculatePaymentReliability(jobs: any[], payments: any[]): number {
  if (jobs.length === 0) return 0;

  // Count jobs that have been paid in full or on time
  let reliablePayments = 0;

  jobs.forEach((job) => {
    if (job.status === 'completed') {
      const jobPayments = payments.filter((p) => p.job_id === job.id);
      const totalPaid = jobPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      if (totalPaid >= (job.total || 0)) {
        reliablePayments++;
      }
    }
  });

  return jobs.length > 0 ? (reliablePayments / jobs.length) * 100 : 0;
}

function calculateSatisfactionIndicators(jobs: any[]): {
  repeatBusiness: boolean;
  timelyCompletion: number;
  averageRating?: number;
} {
  const completedJobs = jobs.filter((job) => job.status === 'completed');

  return {
    repeatBusiness: jobs.length > 1,
    timelyCompletion:
      completedJobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
    // Note: Rating system would need to be implemented separately
    averageRating: undefined,
  };
}
