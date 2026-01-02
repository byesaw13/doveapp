import { supabase } from '@/lib/supabase';
import type {
  KPIMetric,
  KPIPeriod,
  KPITrend,
  AllKPIs,
  KPIDashboard,
  RevenueKPIs,
  JobKPIs,
  ClientKPIs,
  EfficiencyKPIs,
  QualityKPIs,
} from '@/types/kpi';

/**
 * Calculate the date range for a given KPI period
 *
 * Converts period labels ('day', 'week', etc.) into concrete start and end dates
 * for database queries. Always uses the current moment as the end date and
 * calculates the appropriate lookback period.
 *
 * @param period - The time period type to calculate
 *
 * @returns An object with startDate and endDate as Date objects
 *
 * @remarks
 * **Period Calculations:**
 * - 'day': From midnight today (00:00:00) to now
 * - 'week': Last 7 days (now - 7 days to now)
 * - 'month': Last 30 days via setMonth (handles varying month lengths)
 * - 'quarter': Last 3 months (now - 3 months to now)
 * - 'year': Last 12 months (now - 1 year to now)
 * - 'all': From Jan 1, 2000 to now (captures all historical data)
 *
 * **Important Notes:**
 * - endDate is always `new Date()` (current moment)
 * - JavaScript Date.setMonth() automatically handles month overflow
 *   (e.g., May 31 - 1 month = April 30, not April 31)
 * - The 'all' period uses year 2000 as a sufficiently old date to capture
 *   all business data (business started after 2000)
 *
 * @example
 * ```ts
 * // Get last 7 days
 * const { startDate, endDate } = getPeriodDateRange('week');
 * // startDate: 7 days ago, endDate: now
 *
 * // Get current month
 * const range = getPeriodDateRange('month');
 * // If today is Feb 15, 2024: startDate = Jan 15, endDate = Feb 15
 * ```
 */
export function getPeriodDateRange(period: KPIPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date(); // Always use current time as end
  const startDate = new Date();

  switch (period) {
    case 'day':
      // Set to midnight of current day (00:00:00.000)
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      // Go back 7 days from now
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      // Go back 1 month (handles varying month lengths automatically)
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      // Go back 3 months
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      // Go back 1 year
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      // Use year 2000 as far-back date to capture all business data
      startDate.setFullYear(2000, 0, 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate trend direction and percentage change between two time periods
 *
 * Compares current and previous period values to determine if a metric is improving,
 * declining, or remaining stable. This is used across all KPI calculations to provide
 * visual trend indicators in the dashboard.
 *
 * @param current - The metric value for the current period
 * @param previous - The metric value for the previous period
 *
 * @returns An object containing:
 *   - trend: 'up' if improved by >1%, 'down' if declined by >1%, 'stable' otherwise
 *   - change: Absolute difference between current and previous (current - previous)
 *   - changePercent: Percentage change ((change / previous) * 100)
 *
 * @remarks
 * - A 1% threshold is used to filter out noise and prevent minor fluctuations
 *   from triggering trend changes. This provides stable UX in the dashboard.
 * - If previous value is 0, changePercent returns 0 to avoid division by zero
 * - Whether 'up' is good or bad depends on the metric (e.g., revenue up = good,
 *   cancellation rate up = bad). The caller handles interpretation.
 *
 * @example
 * ```ts
 * // Revenue increased from $10,000 to $12,000 (20% increase)
 * calculateTrend(12000, 10000)
 * // Returns: { trend: 'up', change: 2000, changePercent: 20 }
 *
 * // Minor fluctuation (0.5% decrease) - considered stable
 * calculateTrend(9950, 10000)
 * // Returns: { trend: 'stable', change: -50, changePercent: -0.5 }
 * ```
 */
function calculateTrend(
  current: number,
  previous: number
): { trend: KPITrend; change: number; changePercent: number } {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  // Use 1% threshold to filter out minor fluctuations and prevent UI noise
  let trend: KPITrend = 'stable';
  if (Math.abs(changePercent) > 1) {
    trend = changePercent > 0 ? 'up' : 'down';
  }

  return { trend, change, changePercent };
}

/**
 * Calculate comprehensive revenue and financial KPIs for a given time period
 *
 * Analyzes job data to compute key financial metrics including revenue, profit margins,
 * collection rates, and growth trends. Compares current period against an equivalent
 * previous period to show performance trends.
 *
 * @param period - Time period for KPI calculation ('day' | 'week' | 'month' | 'quarter' | 'year' | 'all')
 *
 * @returns A RevenueKPIs object containing:
 *   - totalRevenue: Sum of all job totals in the period
 *   - averageJobValue: Mean revenue per job
 *   - revenueGrowth: Percentage change vs previous period
 *   - monthlyRecurringRevenue: Annualized revenue estimate (total / 12)
 *   - totalPaid: Actual payments received
 *   - totalOutstanding: Unpaid invoices (totalRevenue - totalPaid)
 *   - paymentCollectionRate: Percentage of revenue collected (target: 90%)
 *   - averageDaysToPayment: Time from invoice to payment (placeholder: needs payment_date field)
 *   - grossProfit: Revenue minus direct costs (estimated at 70% of revenue)
 *   - netProfit: Profit after all expenses (estimated at 30% of revenue)
 *   - profitMargin: Net profit as percentage (estimated at 30%, target: 35%)
 *
 * @remarks
 * **Previous Period Calculation:**
 * The previous period is calculated by taking an equal-length time window immediately
 * before the current period. For example:
 * - Current: Jan 1-31 (31 days) → Previous: Dec 1-31 (31 days)
 * - Current: Last 7 days → Previous: 7 days before that
 *
 * **Magic Number Explanations:**
 * - **90% collection rate target**: Industry standard for service businesses. Below 90%
 *   indicates cash flow issues or billing problems.
 * - **MRR calculation (÷12)**: Annualizes the period revenue to monthly. This is simplified
 *   and doesn't account for true recurring vs one-time revenue.
 * - **70% gross profit margin**: Assumes 30% direct costs (labor, materials). This is an
 *   estimate pending cost tracking implementation.
 * - **30% net profit margin**: Assumes 70% total expenses (direct + overhead). Industry
 *   average for home services is 20-35%.
 * - **35% profit margin target**: Aspirational target for healthy service business margins.
 *
 * **Placeholder Metrics (require additional data):**
 * - averageDaysToPayment: Needs `payment_date` field in jobs table (currently returns 30)
 * - grossProfit/netProfit: Need actual cost tracking (currently estimated via percentages)
 *
 * @example
 * ```ts
 * // Get monthly revenue KPIs
 * const kpis = await calculateRevenueKPIs('month');
 * console.log(kpis.totalRevenue.value); // e.g., 45000
 * console.log(kpis.revenueGrowth.value); // e.g., 12.5 (12.5% growth)
 * console.log(kpis.paymentCollectionRate.value); // e.g., 88 (88% collected)
 * ```
 */
export async function calculateRevenueKPIs(
  period: KPIPeriod
): Promise<RevenueKPIs> {
  const { startDate, endDate } = getPeriodDateRange(period);

  // Get all jobs in period
  const { data: jobs } = await supabase
    .from('jobs')
    .select('total, amount_paid, created_at, status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Calculate previous period window of equal length for trend comparison
  // Example: If current period is Jan 1-31, previous is Dec 1-31
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setTime(
    prevStartDate.getTime() - (endDate.getTime() - startDate.getTime())
  );

  const { data: prevJobs } = await supabase
    .from('jobs')
    .select('total, amount_paid')
    .gte('created_at', prevStartDate.toISOString())
    .lt('created_at', startDate.toISOString());

  const totalRevenue = jobs?.reduce((sum, j) => sum + Number(j.total), 0) || 0;
  const prevRevenue =
    prevJobs?.reduce((sum, j) => sum + Number(j.total), 0) || 0;
  const revenueTrend = calculateTrend(totalRevenue, prevRevenue);

  const totalPaid =
    jobs?.reduce((sum, j) => sum + Number(j.amount_paid), 0) || 0;
  const totalOutstanding = totalRevenue - totalPaid;

  const averageJobValue = jobs?.length ? totalRevenue / jobs.length : 0;
  const prevAvgJobValue = prevJobs?.length ? prevRevenue / prevJobs.length : 0;
  const avgJobTrend = calculateTrend(averageJobValue, prevAvgJobValue);

  // Collection rate measures what percentage of billed revenue has been paid
  // Healthy service businesses maintain 85-95% collection rates
  const collectionRate =
    totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

  return {
    totalRevenue: {
      id: 'total_revenue',
      name: 'Total Revenue',
      category: 'revenue',
      value: totalRevenue,
      previousValue: prevRevenue,
      ...revenueTrend,
      unit: 'currency',
      description: 'Total revenue from all jobs',
    },
    averageJobValue: {
      id: 'avg_job_value',
      name: 'Average Job Value',
      category: 'revenue',
      value: averageJobValue,
      previousValue: prevAvgJobValue,
      ...avgJobTrend,
      unit: 'currency',
      description: 'Average value per job',
    },
    revenueGrowth: {
      id: 'revenue_growth',
      name: 'Revenue Growth',
      category: 'revenue',
      value: revenueTrend.changePercent,
      unit: 'percentage',
      description: 'Revenue growth vs previous period',
    },
    monthlyRecurringRevenue: {
      id: 'mrr',
      name: 'Monthly Recurring Revenue',
      category: 'revenue',
      // Divide by 12 to annualize revenue to monthly average
      // NOTE: This is simplified - doesn't distinguish recurring vs one-time revenue
      value: totalRevenue / 12,
      unit: 'currency',
      description: 'Estimated monthly recurring revenue',
    },
    totalPaid: {
      id: 'total_paid',
      name: 'Total Paid',
      category: 'revenue',
      value: totalPaid,
      unit: 'currency',
      description: 'Total payments received',
    },
    totalOutstanding: {
      id: 'total_outstanding',
      name: 'Total Outstanding',
      category: 'revenue',
      value: totalOutstanding,
      unit: 'currency',
      description: 'Total unpaid amount',
    },
    paymentCollectionRate: {
      id: 'collection_rate',
      name: 'Collection Rate',
      category: 'revenue',
      value: collectionRate,
      // 90% target is industry standard for service businesses
      // Below 85% indicates cash flow issues or ineffective billing practices
      target: 90,
      targetProgress: (collectionRate / 90) * 100,
      unit: 'percentage',
      description: 'Percentage of revenue collected',
    },
    averageDaysToPayment: {
      id: 'avg_days_payment',
      name: 'Avg Days to Payment',
      category: 'revenue',
      // PLACEHOLDER: Requires payment_date field in jobs table to calculate actual value
      // Using 30 as industry average for Net 30 payment terms
      value: 30,
      target: 30,
      unit: 'days',
      description: 'Average days from invoice to payment',
    },
    grossProfit: {
      id: 'gross_profit',
      name: 'Gross Profit',
      category: 'revenue',
      // ESTIMATE: Assumes 70% gross margin (30% direct costs for labor + materials)
      // Requires cost tracking system to calculate actual values
      value: totalRevenue * 0.7,
      unit: 'currency',
      description: 'Total revenue minus direct costs',
    },
    netProfit: {
      id: 'net_profit',
      name: 'Net Profit',
      category: 'revenue',
      // ESTIMATE: Assumes 30% net margin after all expenses (direct + overhead)
      // Industry average for home services: 20-35%
      value: totalRevenue * 0.3,
      unit: 'currency',
      description: 'Profit after all expenses',
    },
    profitMargin: {
      id: 'profit_margin',
      name: 'Profit Margin',
      category: 'revenue',
      // ESTIMATE: Using 30% as average, based on grossProfit calculation above
      value: 30,
      // 35% target represents healthy service business margins
      target: 35,
      unit: 'percentage',
      description: 'Net profit as percentage of revenue',
    },
  };
}

/**
 * Calculate comprehensive job-related KPIs for operational performance tracking
 *
 * Analyzes job status distribution, completion rates, conversion metrics, and workload
 * patterns. These metrics help assess operational efficiency and sales effectiveness.
 *
 * @param period - Time period for KPI calculation
 *
 * @returns A JobKPIs object containing:
 *   - totalJobs: All jobs created in period
 *   - activeJobs: Jobs with status 'scheduled' or 'in_progress'
 *   - completedJobs: Successfully finished jobs
 *   - jobCompletionRate: Percentage completed (target: 85%)
 *   - averageJobDuration: Days from start to completion (placeholder)
 *   - jobsPerWeek/Month: Workload volume metrics
 *   - quotesConverted: Number of quotes that became jobs
 *   - quoteConversionRate: Percentage of quotes converted (target: 70%)
 *   - cancelledJobs: Jobs that were cancelled
 *   - cancellationRate: Percentage cancelled (target: <5%)
 *
 * @remarks
 * **Job Status Classification:**
 * - Active: 'scheduled' or 'in_progress' status
 * - Completed: 'completed' status only
 * - Quotes: 'quote' status (not yet converted to jobs)
 * - Cancelled: 'cancelled' status
 *
 * **Rate Calculations:**
 * - Completion Rate = (completedJobs / totalJobs) * 100
 * - Cancellation Rate = (cancelled / totalJobs) * 100
 * - Conversion Rate = ((totalJobs - quotes) / totalJobs) * 100
 *   (Measures what percentage of all records are actual jobs vs quotes)
 *
 * **Period Normalization:**
 * Jobs per week/month are calculated by dividing total jobs by the period length:
 * - daysInPeriod = milliseconds / (1000 * 60 * 60 * 24)
 * - weeksInPeriod = daysInPeriod / 7
 * - monthsInPeriod = daysInPeriod / 30 (using 30-day month average)
 *
 * **Target Explanations:**
 * - 85% completion target: Healthy conversion of started jobs to completion
 * - 70% quote conversion: Industry average for service businesses (30% quote loss is normal)
 * - 5% cancellation target: Acceptable customer churn, higher indicates quality/communication issues
 *
 * **Placeholder Metrics:**
 * - averageJobDuration: Requires time tracking data (currently returns 3 days estimate)
 *
 * @example
 * ```ts
 * const jobKPIs = await calculateJobKPIs('month');
 * console.log(jobKPIs.totalJobs.value); // e.g., 42
 * console.log(jobKPIs.quoteConversionRate.value); // e.g., 68.5%
 * console.log(jobKPIs.jobsPerWeek.value); // e.g., 10.5
 * ```
 */
export async function calculateJobKPIs(period: KPIPeriod): Promise<JobKPIs> {
  const { startDate, endDate } = getPeriodDateRange(period);

  const { data: jobs } = await supabase
    .from('jobs')
    .select('status, created_at, service_date')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const totalJobs = jobs?.length || 0;
  const completedJobs =
    jobs?.filter((j) => j.status === 'completed').length || 0;
  // Active jobs are those currently being worked on or scheduled for work
  const activeJobs =
    jobs?.filter((j) => ['scheduled', 'in_progress'].includes(j.status))
      .length || 0;
  const quotes = jobs?.filter((j) => j.status === 'quote').length || 0;
  const cancelled = jobs?.filter((j) => j.status === 'cancelled').length || 0;

  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const cancellationRate = totalJobs > 0 ? (cancelled / totalJobs) * 100 : 0;
  // Conversion rate: percentage of total records that are actual jobs (not quotes)
  const conversionRate =
    totalJobs > 0 ? ((totalJobs - quotes) / totalJobs) * 100 : 0;

  // Calculate period length for normalizing job counts to weekly/monthly rates
  const daysInPeriod =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const weeksInPeriod = daysInPeriod / 7;
  const monthsInPeriod = daysInPeriod / 30; // Using 30-day average month

  return {
    totalJobs: {
      id: 'total_jobs',
      name: 'Total Jobs',
      category: 'jobs',
      value: totalJobs,
      unit: 'number',
      description: 'Total number of jobs created',
    },
    activeJobs: {
      id: 'active_jobs',
      name: 'Active Jobs',
      category: 'jobs',
      value: activeJobs,
      unit: 'number',
      description: 'Jobs currently in progress or scheduled',
    },
    completedJobs: {
      id: 'completed_jobs',
      name: 'Completed Jobs',
      category: 'jobs',
      value: completedJobs,
      unit: 'number',
      description: 'Successfully completed jobs',
    },
    jobCompletionRate: {
      id: 'completion_rate',
      name: 'Completion Rate',
      category: 'jobs',
      value: completionRate,
      // 85% target: healthy operational efficiency benchmark
      // Lower rates suggest scheduling issues, quality problems, or scope creep
      target: 85,
      targetProgress: (completionRate / 85) * 100,
      unit: 'percentage',
      description: 'Percentage of jobs completed',
    },
    averageJobDuration: {
      id: 'avg_duration',
      name: 'Avg Job Duration',
      category: 'jobs',
      // PLACEHOLDER: Requires time tracking or completion_date field
      // Using 3 days as industry estimate for home service jobs
      value: 3,
      target: 2.5,
      unit: 'days',
      description: 'Average days from start to completion',
    },
    jobsPerWeek: {
      id: 'jobs_per_week',
      name: 'Jobs Per Week',
      category: 'jobs',
      value: totalJobs / weeksInPeriod,
      unit: 'number',
      description: 'Average jobs completed per week',
    },
    jobsPerMonth: {
      id: 'jobs_per_month',
      name: 'Jobs Per Month',
      category: 'jobs',
      value: totalJobs / monthsInPeriod,
      unit: 'number',
      description: 'Average jobs completed per month',
    },
    quotesConverted: {
      id: 'quotes_converted',
      name: 'Quotes Converted',
      category: 'jobs',
      value: totalJobs - quotes,
      unit: 'number',
      description: 'Number of quotes converted to jobs',
    },
    quoteConversionRate: {
      id: 'quote_conversion_rate',
      name: 'Quote Conversion Rate',
      category: 'jobs',
      value: conversionRate,
      // 70% target: industry average for home services quote-to-job conversion
      // 30% quote loss is normal (price shopping, decision delays, choosing competitors)
      target: 70,
      targetProgress: (conversionRate / 70) * 100,
      unit: 'percentage',
      description: 'Percentage of quotes converted',
    },
    cancelledJobs: {
      id: 'cancelled_jobs',
      name: 'Cancelled Jobs',
      category: 'jobs',
      value: cancelled,
      unit: 'number',
      description: 'Number of cancelled jobs',
    },
    cancellationRate: {
      id: 'cancellation_rate',
      name: 'Cancellation Rate',
      category: 'jobs',
      value: cancellationRate,
      // 5% target: acceptable customer churn rate
      // Higher rates suggest quality issues, poor communication, or pricing problems
      target: 5,
      unit: 'percentage',
      description: 'Percentage of jobs cancelled',
    },
  };
}

/**
 * Calculate comprehensive client and customer relationship KPIs
 *
 * Analyzes client acquisition, retention, lifetime value, and repeat business patterns.
 * These metrics measure customer satisfaction, business growth, and sales effectiveness.
 *
 * @param period - Time period for KPI calculation
 *
 * @returns A ClientKPIs object containing:
 *   - totalClients: All-time client count
 *   - activeClients: Clients with at least one job
 *   - newClients: Clients added in period
 *   - clientGrowthRate: New client growth vs previous period (target: 10%)
 *   - clientLifetimeValue: Average revenue per client * 3 (estimate)
 *   - averageRevenuePerClient: Mean revenue across all clients
 *   - repeatClientRate: Percentage with 2+ jobs (target: 60%)
 *   - clientRetentionRate: Retained clients percentage (placeholder)
 *   - clientAcquisitionCost: Marketing cost per new client (placeholder)
 *   - leadToClientConversionRate: Lead conversion percentage (placeholder)
 *
 * @remarks
 * **Repeat Client Logic:**
 * A client is considered "repeat" if they have more than 1 job (count > 1).
 * The calculation:
 * 1. Build clientJobCount map: { clientId: jobCount }
 * 2. Filter for counts > 1
 * 3. Calculate: (repeatClients / totalClients) * 100
 *
 * **Client Lifetime Value Calculation:**
 * LTV = averageRevenuePerClient * 3
 * - Uses 3x multiplier as conservative estimate of customer lifetime
 * - Industry average for home services: 2-5 repeat purchases over lifetime
 * - This is simplified; proper LTV requires churn analysis and cohort tracking
 *
 * **Growth Rate Calculation:**
 * Compares new clients in current period vs new clients in previous equal-length period
 *
 * **Target Explanations:**
 * - 60% repeat rate: healthy customer satisfaction and retention benchmark
 * - 10% growth rate: sustainable monthly client base expansion
 * - 90% retention: industry standard for service businesses
 * - 50% lead conversion: typical for qualified inbound leads
 *
 * **Placeholder Metrics (require additional data):**
 * - clientRetentionRate: Needs historical cohort data (returns 85%)
 * - clientAcquisitionCost: Needs marketing spend tracking (returns $150)
 * - leadToClientConversionRate: Needs lead tracking system (returns 40%)
 *
 * @example
 * ```ts
 * const clientKPIs = await calculateClientKPIs('quarter');
 * console.log(clientKPIs.totalClients.value); // e.g., 127
 * console.log(clientKPIs.repeatClientRate.value); // e.g., 58.3%
 * console.log(clientKPIs.clientLifetimeValue.value); // e.g., $8,400
 * ```
 */
export async function calculateClientKPIs(
  period: KPIPeriod
): Promise<ClientKPIs> {
  const { startDate, endDate } = getPeriodDateRange(period);

  // Get all clients (all-time, not just period)
  const { data: clients } = await supabase
    .from('clients')
    .select('created_at, id');

  // Get clients added during this specific period
  const { data: newClients } = await supabase
    .from('clients')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get all jobs to calculate repeat client rate
  const { data: jobs } = await supabase.from('jobs').select('client_id, total');

  // Build map of client_id -> job count to identify repeat customers
  const clientJobCount: Record<string, number> = {};
  jobs?.forEach((job) => {
    clientJobCount[job.client_id] = (clientJobCount[job.client_id] || 0) + 1;
  });

  // Count clients with more than 1 job (repeat customers)
  const repeatClients = Object.values(clientJobCount).filter(
    (count) => count > 1
  ).length;
  const repeatRate =
    clients?.length && clients.length > 0
      ? (repeatClients / clients.length) * 100
      : 0;

  const totalRevenue = jobs?.reduce((sum, j) => sum + Number(j.total), 0) || 0;
  const avgRevenuePerClient = clients?.length
    ? totalRevenue / clients.length
    : 0;

  const prevPeriodStart = new Date(startDate);
  prevPeriodStart.setTime(
    prevPeriodStart.getTime() - (endDate.getTime() - startDate.getTime())
  );

  const { data: prevClients } = await supabase
    .from('clients')
    .select('*')
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', startDate.toISOString());

  const clientGrowth =
    prevClients && prevClients.length > 0
      ? ((newClients?.length || 0) / prevClients.length) * 100
      : 0;

  return {
    totalClients: {
      id: 'total_clients',
      name: 'Total Clients',
      category: 'clients',
      value: clients?.length || 0,
      unit: 'number',
      description: 'Total number of clients',
    },
    activeClients: {
      id: 'active_clients',
      name: 'Active Clients',
      category: 'clients',
      value: Object.keys(clientJobCount).length,
      unit: 'number',
      description: 'Clients with at least one job',
    },
    newClients: {
      id: 'new_clients',
      name: 'New Clients',
      category: 'clients',
      value: newClients?.length || 0,
      unit: 'number',
      description: 'Clients added this period',
    },
    clientGrowthRate: {
      id: 'client_growth',
      name: 'Client Growth Rate',
      category: 'clients',
      value: clientGrowth,
      // 10% monthly growth target: sustainable expansion rate for service businesses
      // Aggressive but achievable with consistent marketing
      target: 10,
      unit: 'percentage',
      description: 'Client growth vs previous period',
    },
    clientLifetimeValue: {
      id: 'client_ltv',
      name: 'Client Lifetime Value',
      category: 'clients',
      // LTV = avgRevenuePerClient * 3
      // Uses 3x multiplier as conservative lifetime estimate
      // Industry data: home service customers typically return 2-5 times
      // Proper LTV calculation requires churn rate and cohort analysis
      value: avgRevenuePerClient * 3,
      unit: 'currency',
      description: 'Average lifetime value per client',
    },
    averageRevenuePerClient: {
      id: 'avg_revenue_client',
      name: 'Avg Revenue Per Client',
      category: 'clients',
      value: avgRevenuePerClient,
      unit: 'currency',
      description: 'Average revenue generated per client',
    },
    repeatClientRate: {
      id: 'repeat_rate',
      name: 'Repeat Client Rate',
      category: 'clients',
      value: repeatRate,
      // 60% target: industry benchmark for healthy customer loyalty
      // Indicates good service quality and customer satisfaction
      target: 60,
      targetProgress: (repeatRate / 60) * 100,
      unit: 'percentage',
      description: 'Percentage of repeat customers',
    },
    clientRetentionRate: {
      id: 'retention_rate',
      name: 'Client Retention Rate',
      category: 'clients',
      // PLACEHOLDER: Requires cohort analysis and historical retention tracking
      // Using 85% as typical service business retention rate
      value: 85,
      // 90% target: excellent retention, indicates strong customer relationships
      target: 90,
      unit: 'percentage',
      description: 'Percentage of clients retained',
    },
    clientAcquisitionCost: {
      id: 'cac',
      name: 'Client Acquisition Cost',
      category: 'clients',
      // PLACEHOLDER: Requires marketing spend tracking system
      // $150 estimate based on typical home services marketing costs
      // (Google Ads, referral incentives, local advertising)
      value: 150,
      // $100 target: healthy CAC when LTV is 3x average job value
      target: 100,
      unit: 'currency',
      description: 'Cost to acquire new client',
    },
    leadToClientConversionRate: {
      id: 'lead_conversion',
      name: 'Lead Conversion Rate',
      category: 'clients',
      // PLACEHOLDER: Requires lead tracking and CRM integration
      // 40% estimate based on qualified inbound leads
      value: 40,
      // 50% target: high-performing sales conversion rate
      target: 50,
      unit: 'percentage',
      description: 'Leads converted to clients',
    },
  };
}

/**
 * Fetch and aggregate all KPIs across all categories for dashboard display
 *
 * This is the main entry point for KPI data. It calculates revenue, job, client,
 * efficiency, and quality metrics in parallel, then aggregates them with summary
 * statistics for dashboard visualization.
 *
 * @param period - Time period for analysis (defaults to 'month')
 *
 * @returns A KPIDashboard object containing:
 *   - period: The requested time period
 *   - startDate/endDate: ISO date strings for the period
 *   - kpis: Nested object with all KPI categories
 *     - revenue: Financial and profitability metrics
 *     - jobs: Operational performance metrics
 *     - clients: Customer relationship metrics
 *     - efficiency: Operational efficiency metrics (placeholders)
 *     - quality: Service quality metrics (placeholders)
 *   - summary: Aggregate statistics
 *     - totalMetrics: Count of all KPI metrics
 *     - metricsAboveTarget: Count meeting/exceeding targets
 *     - metricsBelowTarget: Count below targets
 *     - averageGrowth: Mean growth percentage across all metrics with trends
 *
 * @remarks
 * **Parallel Processing:**
 * Revenue, job, and client KPIs are fetched in parallel using Promise.all() to
 * minimize database round trips and reduce total calculation time.
 *
 * **Efficiency and Quality KPIs:**
 * These categories currently return placeholder/hardcoded values as they require
 * additional data sources not yet implemented:
 * - Time tracking for labor efficiency
 * - Material usage tracking for waste rates
 * - Customer feedback system for satisfaction scores
 * - Warranty/callback tracking systems
 *
 * **Summary Statistics:**
 * The summary aggregates all metrics to provide dashboard-level insights:
 * - Flattens all categories into single array using flatMap
 * - Filters metrics that have targets defined
 * - Counts how many are above/below target thresholds
 * - Calculates average growth across all metrics with changePercent
 *
 * @example
 * ```ts
 * // Get comprehensive KPI dashboard for current month
 * const dashboard = await getAllKPIs('month');
 * console.log(dashboard.summary.metricsAboveTarget); // e.g., 23
 * console.log(dashboard.summary.averageGrowth); // e.g., 8.5 (8.5% average growth)
 * console.log(dashboard.kpis.revenue.totalRevenue.value); // e.g., 45000
 * ```
 */
export async function getAllKPIs(
  period: KPIPeriod = 'month'
): Promise<KPIDashboard> {
  const { startDate, endDate } = getPeriodDateRange(period);

  // Fetch revenue, job, and client KPIs in parallel for performance
  const [revenue, jobs, clients] = await Promise.all([
    calculateRevenueKPIs(period),
    calculateJobKPIs(period),
    calculateClientKPIs(period),
  ]);

  // PLACEHOLDER METRICS: Efficiency and Quality KPIs
  // These return hardcoded values until the following systems are implemented:
  // - Time tracking system for labor hours and job duration
  // - Material usage tracking for waste calculations
  // - Customer feedback/survey system for satisfaction scores
  // - Warranty and callback tracking databases
  const efficiency: EfficiencyKPIs = {
    averageTimePerJob: {
      id: 'avg_time_job',
      name: 'Avg Time Per Job',
      category: 'efficiency',
      value: 4,
      target: 3.5,
      unit: 'hours',
    },
    laborEfficiencyRate: {
      id: 'labor_efficiency',
      name: 'Labor Efficiency',
      category: 'efficiency',
      value: 85,
      target: 90,
      unit: 'percentage',
    },
    schedulingEfficiency: {
      id: 'scheduling_efficiency',
      name: 'Scheduling Efficiency',
      category: 'efficiency',
      value: 90,
      target: 95,
      unit: 'percentage',
    },
    crewUtilizationRate: {
      id: 'crew_utilization',
      name: 'Crew Utilization',
      category: 'efficiency',
      value: 75,
      target: 85,
      unit: 'percentage',
    },
    equipmentUtilizationRate: {
      id: 'equipment_utilization',
      name: 'Equipment Utilization',
      category: 'efficiency',
      value: 70,
      target: 80,
      unit: 'percentage',
    },
    materialWasteRate: {
      id: 'material_waste',
      name: 'Material Waste Rate',
      category: 'efficiency',
      value: 5,
      target: 3,
      unit: 'percentage',
    },
    jobsPerTechnician: {
      id: 'jobs_per_tech',
      name: 'Jobs Per Technician',
      category: 'efficiency',
      value: 15,
      target: 20,
      unit: 'number',
    },
    revenuePerLaborHour: {
      id: 'revenue_per_hour',
      name: 'Revenue Per Labor Hour',
      category: 'efficiency',
      value: 75,
      target: 100,
      unit: 'currency',
    },
    overtimeRate: {
      id: 'overtime_rate',
      name: 'Overtime Rate',
      category: 'efficiency',
      value: 10,
      target: 5,
      unit: 'percentage',
    },
  };

  const quality: QualityKPIs = {
    customerSatisfactionScore: {
      id: 'csat',
      name: 'Customer Satisfaction',
      category: 'quality',
      value: 4.5,
      target: 4.7,
      unit: 'number',
    },
    netPromoterScore: {
      id: 'nps',
      name: 'Net Promoter Score',
      category: 'quality',
      value: 45,
      target: 50,
      unit: 'number',
    },
    firstTimeFixRate: {
      id: 'first_fix_rate',
      name: 'First-Time Fix Rate',
      category: 'quality',
      value: 90,
      target: 95,
      unit: 'percentage',
    },
    reworkRate: {
      id: 'rework_rate',
      name: 'Rework Rate',
      category: 'quality',
      value: 5,
      target: 2,
      unit: 'percentage',
    },
    callbackRate: {
      id: 'callback_rate',
      name: 'Callback Rate',
      category: 'quality',
      value: 3,
      target: 1,
      unit: 'percentage',
    },
    warrantyClaimRate: {
      id: 'warranty_rate',
      name: 'Warranty Claim Rate',
      category: 'quality',
      value: 2,
      target: 1,
      unit: 'percentage',
    },
    responseTime: {
      id: 'response_time',
      name: 'Response Time',
      category: 'quality',
      value: 2,
      target: 1,
      unit: 'hours',
    },
    emailResponseRate: {
      id: 'email_response_rate',
      name: 'Email Response Rate',
      category: 'quality',
      value: 95,
      target: 98,
      unit: 'percentage',
    },
    appointmentKeepRate: {
      id: 'appointment_keep_rate',
      name: 'Appointment Keep Rate',
      category: 'quality',
      value: 92,
      target: 95,
      unit: 'percentage',
    },
  };

  const allKPIs: AllKPIs = {
    revenue,
    jobs,
    clients,
    efficiency,
    quality,
  };

  // Calculate summary statistics for dashboard overview
  // Flatten all KPI categories into a single array for analysis
  const allMetrics = Object.values(allKPIs).flatMap((category) =>
    Object.values(category)
  ) as KPIMetric[];

  // Count metrics meeting/missing targets
  const metricsWithTargets = allMetrics.filter((m) => m.target !== undefined);
  const metricsAboveTarget = metricsWithTargets.filter(
    (m) => m.value >= m.target!
  ).length;
  const metricsBelowTarget = metricsWithTargets.length - metricsAboveTarget;

  // Calculate average growth rate across all metrics with trend data
  // This gives an overall business health indicator
  const metricsWithChange = allMetrics.filter(
    (m) => m.changePercent !== undefined
  );
  const averageGrowth =
    metricsWithChange.length > 0
      ? metricsWithChange.reduce((sum, m) => sum + (m.changePercent || 0), 0) /
        metricsWithChange.length
      : 0;

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    kpis: allKPIs,
    summary: {
      totalMetrics: allMetrics.length,
      metricsAboveTarget,
      metricsBelowTarget,
      averageGrowth,
    },
  };
}
