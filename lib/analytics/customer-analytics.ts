/**
 * Customer Analytics Functions
 * Calculates customer lifetime value, repeat business metrics, and other customer insights
 */

export interface CustomerAnalytics {
  customerId: string;
  totalJobs: number;
  totalRevenue: number;
  averageJobValue: number;
  lifetimeValue: number;
  firstJobDate: string;
  lastJobDate: string;
  jobFrequency: number; // jobs per month
  repeatBusinessRate: number; // percentage of repeat jobs
  customerSegment: 'new' | 'regular' | 'vip' | 'inactive';
  nextPredictedJob?: string;
  satisfactionScore?: number;
}

export interface CustomerSegmentSummary {
  segment: string;
  customerCount: number;
  totalRevenue: number;
  averageLifetimeValue: number;
  averageJobFrequency: number;
  retentionRate: number;
}

/**
 * Calculate Customer Lifetime Value (CLV)
 * CLV = Average Order Value × Purchase Frequency × Customer Lifespan
 */
export async function calculateCustomerLifetimeValue(
  customerId: string,
  supabase: any
): Promise<CustomerAnalytics> {
  // Get all jobs for this customer
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      total,
      created_at,
      status
    `
    )
    .eq('client_id', customerId)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (error || !jobs || jobs.length === 0) {
    return {
      customerId,
      totalJobs: 0,
      totalRevenue: 0,
      averageJobValue: 0,
      lifetimeValue: 0,
      firstJobDate: '',
      lastJobDate: '',
      jobFrequency: 0,
      repeatBusinessRate: 0,
      customerSegment: 'new',
    };
  }

  const totalRevenue = jobs.reduce((sum, job) => sum + (job.total || 0), 0);
  const averageJobValue = totalRevenue / jobs.length;

  // Calculate job frequency (jobs per month)
  const firstJobDate = new Date(jobs[0].created_at);
  const lastJobDate = new Date(jobs[jobs.length - 1].created_at);
  const monthsActive = Math.max(
    1,
    (lastJobDate.getTime() - firstJobDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );
  const jobFrequency = jobs.length / monthsActive;

  // Calculate repeat business rate
  // Jobs after the first one are considered repeat business
  const repeatBusinessRate =
    jobs.length > 1 ? ((jobs.length - 1) / jobs.length) * 100 : 0;

  // Determine customer segment
  let customerSegment: 'new' | 'regular' | 'vip' | 'inactive' = 'new';

  if (jobs.length >= 5 && totalRevenue >= 5000) {
    customerSegment = 'vip';
  } else if (jobs.length >= 3 || jobFrequency >= 0.5) {
    customerSegment = 'regular';
  } else if (monthsActive > 12 && jobs.length < 2) {
    customerSegment = 'inactive';
  }

  // Calculate lifetime value
  // Using a simplified model: CLV = Average Job Value × Job Frequency × Expected Lifespan (24 months)
  const expectedLifespanMonths = 24;
  const lifetimeValue = averageJobValue * jobFrequency * expectedLifespanMonths;

  return {
    customerId,
    totalJobs: jobs.length,
    totalRevenue,
    averageJobValue,
    lifetimeValue,
    firstJobDate: firstJobDate.toISOString(),
    lastJobDate: lastJobDate.toISOString(),
    jobFrequency,
    repeatBusinessRate,
    customerSegment,
  };
}

/**
 * Get customer segment summary across all customers
 */
export async function getCustomerSegmentSummary(
  supabase: any
): Promise<CustomerSegmentSummary[]> {
  // Get all customers with their job data
  const { data: customers, error } = await supabase.from('clients').select(`
      id,
      jobs!jobs_client_id_fkey (
        id,
        total,
        created_at,
        status
      )
    `);

  if (error || !customers) {
    return [];
  }

  const segmentMap = new Map<string, CustomerSegmentSummary>();

  for (const customer of customers) {
    if (!customer.jobs || customer.jobs.length === 0) continue;

    const completedJobs = customer.jobs.filter(
      (job) => job.status === 'completed'
    );
    if (completedJobs.length === 0) continue;

    const analytics = await calculateCustomerLifetimeValue(
      customer.id,
      supabase
    );

    if (!segmentMap.has(analytics.customerSegment)) {
      segmentMap.set(analytics.customerSegment, {
        segment: analytics.customerSegment,
        customerCount: 0,
        totalRevenue: 0,
        averageLifetimeValue: 0,
        averageJobFrequency: 0,
        retentionRate: 0,
      });
    }

    const segment = segmentMap.get(analytics.customerSegment)!;
    segment.customerCount++;
    segment.totalRevenue += analytics.totalRevenue;
    segment.averageLifetimeValue += analytics.lifetimeValue;
    segment.averageJobFrequency += analytics.jobFrequency;
  }

  // Calculate averages
  const segments = Array.from(segmentMap.values()).map((segment) => ({
    ...segment,
    averageLifetimeValue: segment.averageLifetimeValue / segment.customerCount,
    averageJobFrequency: segment.averageJobFrequency / segment.customerCount,
    retentionRate: (segment.customerCount / customers.length) * 100,
  }));

  return segments.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get top customers by lifetime value
 */
export async function getTopCustomersByLifetimeValue(
  supabase: any,
  limit: number = 10
): Promise<CustomerAnalytics[]> {
  const { data: customers, error } = await supabase
    .from('clients')
    .select('id')
    .limit(100); // Get first 100 customers to analyze

  if (error || !customers) {
    return [];
  }

  const customerAnalytics: CustomerAnalytics[] = [];

  for (const customer of customers) {
    const analytics = await calculateCustomerLifetimeValue(
      customer.id,
      supabase
    );
    if (analytics.totalJobs > 0) {
      customerAnalytics.push(analytics);
    }
  }

  return customerAnalytics
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, limit);
}

/**
 * Calculate customer retention and churn metrics
 */
export interface RetentionMetrics {
  totalCustomers: number;
  activeCustomers: number; // Jobs in last 6 months
  retainedCustomers: number; // Multiple jobs ever
  churnRate: number; // Percentage who haven't returned
  averageRetentionPeriod: number; // Months between first and last job
}

export async function calculateRetentionMetrics(
  supabase: any
): Promise<RetentionMetrics> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Get all customers with job history
  const { data: customers, error } = await supabase.from('clients').select(`
      id,
      jobs!jobs_client_id_fkey (
        id,
        created_at,
        status
      )
    `);

  if (error || !customers) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      retainedCustomers: 0,
      churnRate: 0,
      averageRetentionPeriod: 0,
    };
  }

  let activeCustomers = 0;
  let retainedCustomers = 0;
  let totalRetentionPeriod = 0;
  let customersWithMultipleJobs = 0;

  for (const customer of customers) {
    if (!customer.jobs || customer.jobs.length === 0) continue;

    const completedJobs = customer.jobs.filter(
      (job) => job.status === 'completed'
    );
    if (completedJobs.length === 0) continue;

    // Check if active (job in last 6 months)
    const recentJobs = completedJobs.filter(
      (job) => new Date(job.created_at) >= sixMonthsAgo
    );
    if (recentJobs.length > 0) {
      activeCustomers++;
    }

    // Check retention
    if (completedJobs.length > 1) {
      retainedCustomers++;
      customersWithMultipleJobs++;

      // Calculate retention period
      const firstJob = new Date(
        Math.min(...completedJobs.map((j) => new Date(j.created_at).getTime()))
      );
      const lastJob = new Date(
        Math.max(...completedJobs.map((j) => new Date(j.created_at).getTime()))
      );
      const retentionMonths =
        (lastJob.getTime() - firstJob.getTime()) / (1000 * 60 * 60 * 24 * 30);
      totalRetentionPeriod += retentionMonths;
    }
  }

  const churnRate =
    customers.length > 0
      ? ((customers.length - retainedCustomers) / customers.length) * 100
      : 0;
  const averageRetentionPeriod =
    customersWithMultipleJobs > 0
      ? totalRetentionPeriod / customersWithMultipleJobs
      : 0;

  return {
    totalCustomers: customers.length,
    activeCustomers,
    retainedCustomers,
    churnRate,
    averageRetentionPeriod,
  };
}

/**
 * Predict next job for a customer based on historical patterns
 */
export async function predictNextCustomerJob(
  customerId: string,
  supabase: any
): Promise<string | null> {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('created_at')
    .eq('client_id', customerId)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (error || !jobs || jobs.length < 2) {
    return null; // Need at least 2 jobs for prediction
  }

  // Calculate average interval between jobs
  const intervals: number[] = [];
  for (let i = 1; i < jobs.length; i++) {
    const prevJob = new Date(jobs[i - 1].created_at);
    const currentJob = new Date(jobs[i].created_at);
    const intervalDays =
      (currentJob.getTime() - prevJob.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(intervalDays);
  }

  if (intervals.length === 0) return null;

  const averageInterval =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const lastJobDate = new Date(jobs[jobs.length - 1].created_at);
  const predictedDate = new Date(
    lastJobDate.getTime() + averageInterval * 24 * 60 * 60 * 1000
  );

  return predictedDate.toISOString();
}
