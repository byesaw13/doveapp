/**
 * Advanced Business Intelligence Functions
 * Comprehensive analytics for business decision making
 */

export interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
    byService: Array<{ service: string; revenue: number; count: number }>;
    growth: number; // percentage growth from last period
  };
  profitability: {
    grossMargin: number;
    netMargin: number;
    averageJobMargin: number;
    costBreakdown: {
      labor: number;
      materials: number;
      overhead: number;
      other: number;
    };
  };
  operations: {
    averageJobDuration: number;
    completionRate: number;
    customerRetentionRate: number;
    repeatBusinessRate: number;
  };
  cashflow: {
    projectedCashflow: Array<{ date: string; amount: number }>;
    daysOutstanding: number;
    overdueAmount: number;
  };
  market: {
    marketShare?: number; // if available
    competitivePosition?: string;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
  };
}

/**
 * Calculate comprehensive business metrics
 */
export async function calculateBusinessMetrics(
  supabase: any,
  period: 'month' | 'quarter' | 'year' = 'month'
): Promise<BusinessMetrics> {
  // Calculate date ranges
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      previousStartDate = new Date(now.getFullYear(), quarterStart - 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
  }

  // Get current period data
  const { data: currentJobs, error: jobsError } = await supabase
    .from('jobs')
    .select(
      `
      id,
      total,
      created_at,
      service_date,
      status,
      job_line_items (
        item_type,
        quantity,
        unit_price
      )
    `
    )
    .gte('service_date', startDate.toISOString().split('T')[0])
    .lte('service_date', now.toISOString().split('T')[0])
    .eq('status', 'completed');

  // Get previous period data for growth calculation
  const { data: previousJobs } = await supabase
    .from('jobs')
    .select('id, total')
    .gte('service_date', previousStartDate.toISOString().split('T')[0])
    .lt('service_date', startDate.toISOString().split('T')[0])
    .eq('status', 'completed');

  // Calculate revenue metrics
  const totalRevenue =
    currentJobs?.reduce((sum, job) => sum + (job.total || 0), 0) || 0;
  const previousRevenue =
    previousJobs?.reduce((sum, job) => sum + (job.total || 0), 0) || 0;
  const revenueGrowth =
    previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

  // Calculate service type performance
  const servicePerformance: Record<string, { revenue: number; count: number }> =
    {};
  currentJobs?.forEach((job) => {
    // Try to determine service type from job line items or title
    const serviceType = determineServiceType(job);
    if (!servicePerformance[serviceType]) {
      servicePerformance[serviceType] = { revenue: 0, count: 0 };
    }
    servicePerformance[serviceType].revenue += job.total || 0;
    servicePerformance[serviceType].count += 1;
  });

  const byService = Object.entries(servicePerformance)
    .map(([service, data]) => ({ service, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // Calculate profitability
  const costBreakdown = calculateCostBreakdown(currentJobs || []);
  const totalCosts = Object.values(costBreakdown).reduce(
    (sum, cost) => sum + cost,
    0
  );
  const grossMargin =
    totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
  const netMargin = grossMargin * 0.7; // Simplified - assuming 30% taxes/fees
  const averageJobMargin = currentJobs?.length
    ? grossMargin / currentJobs.length
    : 0;

  // Calculate operational metrics
  const averageJobDuration = calculateAverageJobDuration(currentJobs || []);
  const completionRate = calculateCompletionRate(currentJobs || []);
  const customerRetentionRate = await calculateRetentionRate(
    supabase,
    startDate,
    now
  );
  const repeatBusinessRate = await calculateRepeatBusinessRate(
    supabase,
    startDate,
    now
  );

  // Calculate cash flow metrics
  const cashflowProjection = await calculateCashflowProjection(supabase);
  const daysOutstanding = await calculateDaysOutstanding(supabase);
  const overdueAmount = await calculateOverdueAmount(supabase);

  // Calculate market metrics
  const customerAcquisitionCost = calculateCAC(
    totalRevenue,
    currentJobs?.length || 0
  );
  const customerLifetimeValue = calculateCLV(
    totalRevenue,
    customerRetentionRate,
    currentJobs?.length || 0
  );

  return {
    revenue: {
      total: totalRevenue,
      monthly: await calculateMonthlyRevenue(supabase, period),
      byService,
      growth: revenueGrowth,
    },
    profitability: {
      grossMargin,
      netMargin,
      averageJobMargin,
      costBreakdown,
    },
    operations: {
      averageJobDuration,
      completionRate,
      customerRetentionRate,
      repeatBusinessRate,
    },
    cashflow: {
      projectedCashflow: cashflowProjection,
      daysOutstanding,
      overdueAmount,
    },
    market: {
      customerAcquisitionCost,
      customerLifetimeValue,
    },
  };
}

/**
 * Helper functions for detailed calculations
 */

function determineServiceType(job: any): string {
  // Try to determine service type from line items or job title
  const title = job.title?.toLowerCase() || '';
  const lineItems = job.job_line_items || [];

  // Check line item descriptions
  for (const item of lineItems) {
    const desc = item.description?.toLowerCase() || '';
    if (desc.includes('plumb')) return 'plumbing';
    if (
      desc.includes('electr') ||
      desc.includes('outlet') ||
      desc.includes('wire')
    )
      return 'electrical';
    if (desc.includes('hvac') || desc.includes('heat') || desc.includes('air'))
      return 'hvac';
    if (
      desc.includes('paint') ||
      desc.includes('wall') ||
      desc.includes('ceiling')
    )
      return 'painting';
  }

  // Fallback to title-based detection
  if (title.includes('plumb')) return 'plumbing';
  if (
    title.includes('electr') ||
    title.includes('outlet') ||
    title.includes('wire')
  )
    return 'electrical';
  if (title.includes('hvac') || title.includes('heat') || title.includes('air'))
    return 'hvac';
  if (title.includes('paint')) return 'painting';

  return 'other';
}

function calculateCostBreakdown(jobs: any[]): {
  labor: number;
  materials: number;
  overhead: number;
  other: number;
} {
  let labor = 0;
  let materials = 0;
  let overhead = 0;
  let other = 0;

  jobs.forEach((job) => {
    const lineItems = job.job_line_items || [];
    lineItems.forEach((item: any) => {
      const cost = (item.quantity || 0) * (item.unit_price || 0);
      switch (item.item_type) {
        case 'labor':
          labor += cost;
          break;
        case 'material':
          materials += cost;
          break;
        default:
          other += cost;
      }
    });
  });

  // Add overhead (simplified as 20% of labor + materials)
  overhead = (labor + materials) * 0.2;

  return { labor, materials, overhead, other };
}

function calculateAverageJobDuration(jobs: any[]): number {
  // Simplified - would need start/end times to calculate properly
  // For now, return estimated duration based on service type
  if (jobs.length === 0) return 0;

  const durations = jobs.map((job) => {
    const serviceType = determineServiceType(job);
    switch (serviceType) {
      case 'plumbing':
        return 2.5;
      case 'electrical':
        return 2.0;
      case 'hvac':
        return 1.5;
      case 'painting':
        return 6.0;
      default:
        return 3.0;
    }
  });

  return (
    durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  );
}

function calculateCompletionRate(jobs: any[]): number {
  if (jobs.length === 0) return 0;

  const completedJobs = jobs.filter((job) => job.status === 'completed').length;
  return (completedJobs / jobs.length) * 100;
}

async function calculateRetentionRate(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Simplified retention calculation
  // In a real implementation, this would track returning customers over time
  const { data: customers } = await supabase.from('clients').select(`
      id,
      jobs!jobs_client_id_fkey (
        id,
        created_at
      )
    `);

  if (!customers || customers.length === 0) return 0;

  let retainedCustomers = 0;
  customers.forEach((customer) => {
    if (customer.jobs && customer.jobs.length > 1) {
      retainedCustomers++;
    }
  });

  return customers.length > 0
    ? (retainedCustomers / customers.length) * 100
    : 0;
}

async function calculateRepeatBusinessRate(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Calculate percentage of jobs that are from repeat customers
  const { data: jobs } = await supabase
    .from('jobs')
    .select(
      `
      id,
      client_id,
      clients!jobs_client_id_fkey (
        id,
        jobs!jobs_client_id_fkey (id)
      )
    `
    )
    .gte('service_date', startDate.toISOString().split('T')[0])
    .lte('service_date', endDate.toISOString().split('T')[0]);

  if (!jobs || jobs.length === 0) return 0;

  let repeatJobs = 0;
  jobs.forEach((job) => {
    if (job.clients?.jobs && job.clients.jobs.length > 1) {
      repeatJobs++;
    }
  });

  return (repeatJobs / jobs.length) * 100;
}

async function calculateMonthlyRevenue(
  supabase: any,
  period: string
): Promise<Array<{ month: string; amount: number }>> {
  // Get monthly revenue for the last 12 months
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('total')
      .gte('service_date', monthStart.toISOString().split('T')[0])
      .lte('service_date', monthEnd.toISOString().split('T')[0])
      .eq('status', 'completed');

    const revenue = jobs?.reduce((sum, job) => sum + (job.total || 0), 0) || 0;

    months.push({
      month: monthStart.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      amount: revenue,
    });
  }

  return months;
}

async function calculateCashflowProjection(
  supabase: any
): Promise<Array<{ date: string; amount: number }>> {
  // Simplified cash flow projection for next 30 days
  const projection = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    // Get expected payments for this date
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total')
      .eq('due_date', date.toISOString().split('T')[0])
      .neq('status', 'paid');

    const amount =
      invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
    projection.push({
      date: date.toISOString().split('T')[0],
      amount,
    });
  }

  return projection;
}

async function calculateDaysOutstanding(supabase: any): Promise<number> {
  // Calculate average days invoices remain outstanding
  const { data: invoices } = await supabase
    .from('invoices')
    .select('created_at, paid_at')
    .neq('status', 'paid')
    .not('paid_at', 'is', null);

  if (!invoices || invoices.length === 0) return 0;

  const totalDays = invoices.reduce((sum, invoice) => {
    const created = new Date(invoice.created_at);
    const paid = new Date(invoice.paid_at);
    const days = (paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round(totalDays / invoices.length);
}

async function calculateOverdueAmount(supabase: any): Promise<number> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total')
    .lt('due_date', new Date().toISOString().split('T')[0])
    .neq('status', 'paid');

  return invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
}

function calculateCAC(totalRevenue: number, jobCount: number): number {
  // Simplified CAC calculation
  // In reality, this would include marketing costs, etc.
  // For now, assume 15% of revenue goes to customer acquisition
  return (totalRevenue * 0.15) / Math.max(jobCount, 1);
}

function calculateCLV(
  totalRevenue: number,
  retentionRate: number,
  jobCount: number
): number {
  // Simplified CLV using the formula: CLV = (Average Revenue per Customer × Gross Margin) / (1 - Retention Rate)
  const averageRevenuePerCustomer = jobCount > 0 ? totalRevenue / jobCount : 0;
  const grossMargin = 0.4; // Assume 40% gross margin
  const retentionRateDecimal = retentionRate / 100;

  if (retentionRateDecimal >= 1) return averageRevenuePerCustomer * grossMargin;

  return (averageRevenuePerCustomer * grossMargin) / (1 - retentionRateDecimal);
}
