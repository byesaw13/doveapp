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
 * Calculate date range for given period
 */
export function getPeriodDateRange(period: KPIPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000, 0, 1); // Far back date
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate trend direction and percentage change
 */
function calculateTrend(
  current: number,
  previous: number
): { trend: KPITrend; change: number; changePercent: number } {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  let trend: KPITrend = 'stable';
  if (Math.abs(changePercent) > 1) {
    trend = changePercent > 0 ? 'up' : 'down';
  }

  return { trend, change, changePercent };
}

/**
 * Calculate Revenue KPIs
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

  // Get previous period for comparison
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
      value: totalRevenue / 12, // Simplified
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
      target: 90,
      targetProgress: (collectionRate / 90) * 100,
      unit: 'percentage',
      description: 'Percentage of revenue collected',
    },
    averageDaysToPayment: {
      id: 'avg_days_payment',
      name: 'Avg Days to Payment',
      category: 'revenue',
      value: 30, // Would need payment dates to calculate
      target: 30,
      unit: 'days',
      description: 'Average days from invoice to payment',
    },
    grossProfit: {
      id: 'gross_profit',
      name: 'Gross Profit',
      category: 'revenue',
      value: totalRevenue * 0.7, // Simplified - would need cost data
      unit: 'currency',
      description: 'Total revenue minus direct costs',
    },
    netProfit: {
      id: 'net_profit',
      name: 'Net Profit',
      category: 'revenue',
      value: totalRevenue * 0.3, // Simplified
      unit: 'currency',
      description: 'Profit after all expenses',
    },
    profitMargin: {
      id: 'profit_margin',
      name: 'Profit Margin',
      category: 'revenue',
      value: 30, // Simplified percentage
      target: 35,
      unit: 'percentage',
      description: 'Net profit as percentage of revenue',
    },
  };
}

/**
 * Calculate Job KPIs
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
  const activeJobs =
    jobs?.filter((j) => ['scheduled', 'in_progress'].includes(j.status))
      .length || 0;
  const quotes = jobs?.filter((j) => j.status === 'quote').length || 0;
  const cancelled = jobs?.filter((j) => j.status === 'cancelled').length || 0;

  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const cancellationRate = totalJobs > 0 ? (cancelled / totalJobs) * 100 : 0;
  const conversionRate =
    totalJobs > 0 ? ((totalJobs - quotes) / totalJobs) * 100 : 0;

  const daysInPeriod =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const weeksInPeriod = daysInPeriod / 7;
  const monthsInPeriod = daysInPeriod / 30;

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
      target: 85,
      targetProgress: (completionRate / 85) * 100,
      unit: 'percentage',
      description: 'Percentage of jobs completed',
    },
    averageJobDuration: {
      id: 'avg_duration',
      name: 'Avg Job Duration',
      category: 'jobs',
      value: 3, // Would need time tracking data
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
      target: 5,
      unit: 'percentage',
      description: 'Percentage of jobs cancelled',
    },
  };
}

/**
 * Calculate Client KPIs
 */
export async function calculateClientKPIs(
  period: KPIPeriod
): Promise<ClientKPIs> {
  const { startDate, endDate } = getPeriodDateRange(period);

  // Get all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('created_at, id');

  const { data: newClients } = await supabase
    .from('clients')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get jobs per client for repeat rate
  const { data: jobs } = await supabase.from('jobs').select('client_id, total');

  const clientJobCount: Record<string, number> = {};
  jobs?.forEach((job) => {
    clientJobCount[job.client_id] = (clientJobCount[job.client_id] || 0) + 1;
  });

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
      target: 10,
      unit: 'percentage',
      description: 'Client growth vs previous period',
    },
    clientLifetimeValue: {
      id: 'client_ltv',
      name: 'Client Lifetime Value',
      category: 'clients',
      value: avgRevenuePerClient * 3, // Simplified estimate
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
      target: 60,
      targetProgress: (repeatRate / 60) * 100,
      unit: 'percentage',
      description: 'Percentage of repeat customers',
    },
    clientRetentionRate: {
      id: 'retention_rate',
      name: 'Client Retention Rate',
      category: 'clients',
      value: 85, // Would need historical data
      target: 90,
      unit: 'percentage',
      description: 'Percentage of clients retained',
    },
    clientAcquisitionCost: {
      id: 'cac',
      name: 'Client Acquisition Cost',
      category: 'clients',
      value: 150, // Would need marketing spend data
      target: 100,
      unit: 'currency',
      description: 'Cost to acquire new client',
    },
    leadToClientConversionRate: {
      id: 'lead_conversion',
      name: 'Lead Conversion Rate',
      category: 'clients',
      value: 40, // Would need lead tracking
      target: 50,
      unit: 'percentage',
      description: 'Leads converted to clients',
    },
  };
}

/**
 * Get all KPIs for a given period
 */
export async function getAllKPIs(
  period: KPIPeriod = 'month'
): Promise<KPIDashboard> {
  const { startDate, endDate } = getPeriodDateRange(period);

  const [revenue, jobs, clients] = await Promise.all([
    calculateRevenueKPIs(period),
    calculateJobKPIs(period),
    calculateClientKPIs(period),
  ]);

  // Placeholder for efficiency and quality KPIs
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

  // Calculate summary stats
  const allMetrics = Object.values(allKPIs).flatMap((category) =>
    Object.values(category)
  ) as KPIMetric[];
  const metricsWithTargets = allMetrics.filter((m) => m.target !== undefined);
  const metricsAboveTarget = metricsWithTargets.filter(
    (m) => m.value >= m.target!
  ).length;
  const metricsBelowTarget = metricsWithTargets.length - metricsAboveTarget;

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
