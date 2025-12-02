// KPI (Key Performance Indicator) types for business metrics

export type KPIPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
export type KPITrend = 'up' | 'down' | 'stable';
export type KPICategory =
  | 'revenue'
  | 'jobs'
  | 'clients'
  | 'efficiency'
  | 'quality';

export interface KPIMetric {
  id: string;
  name: string;
  category: KPICategory;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: KPITrend;
  target?: number;
  targetProgress?: number;
  unit: 'currency' | 'number' | 'percentage' | 'hours' | 'days';
  description?: string;
  icon?: string;
}

export interface RevenueKPIs {
  // Revenue Metrics
  totalRevenue: KPIMetric;
  averageJobValue: KPIMetric;
  revenueGrowth: KPIMetric;
  monthlyRecurringRevenue: KPIMetric;

  // Cash Flow
  totalPaid: KPIMetric;
  totalOutstanding: KPIMetric;
  paymentCollectionRate: KPIMetric;
  averageDaysToPayment: KPIMetric;

  // Profit Margins
  grossProfit: KPIMetric;
  netProfit: KPIMetric;
  profitMargin: KPIMetric;
}

export interface JobKPIs {
  // Job Volume
  totalJobs: KPIMetric;
  activeJobs: KPIMetric;
  completedJobs: KPIMetric;
  jobCompletionRate: KPIMetric;

  // Job Performance
  averageJobDuration: KPIMetric;
  jobsPerWeek: KPIMetric;
  jobsPerMonth: KPIMetric;

  // Job Status
  quotesConverted: KPIMetric;
  quoteConversionRate: KPIMetric;
  cancelledJobs: KPIMetric;
  cancellationRate: KPIMetric;
}

export interface ClientKPIs {
  // Client Base
  totalClients: KPIMetric;
  activeClients: KPIMetric;
  newClients: KPIMetric;
  clientGrowthRate: KPIMetric;

  // Client Value
  clientLifetimeValue: KPIMetric;
  averageRevenuePerClient: KPIMetric;
  repeatClientRate: KPIMetric;
  clientRetentionRate: KPIMetric;

  // Client Acquisition
  clientAcquisitionCost: KPIMetric;
  leadToClientConversionRate: KPIMetric;
}

export interface EfficiencyKPIs {
  // Time Management
  averageTimePerJob: KPIMetric;
  laborEfficiencyRate: KPIMetric;
  schedulingEfficiency: KPIMetric;

  // Resource Utilization
  crewUtilizationRate: KPIMetric;
  equipmentUtilizationRate: KPIMetric;
  materialWasteRate: KPIMetric;

  // Productivity
  jobsPerTechnician: KPIMetric;
  revenuePerLaborHour: KPIMetric;
  overtimeRate: KPIMetric;
}

export interface QualityKPIs {
  // Service Quality
  customerSatisfactionScore: KPIMetric;
  netPromoterScore: KPIMetric;
  firstTimeFixRate: KPIMetric;

  // Job Quality
  reworkRate: KPIMetric;
  callbackRate: KPIMetric;
  warrantyClaimRate: KPIMetric;

  // Communication
  responseTime: KPIMetric;
  emailResponseRate: KPIMetric;
  appointmentKeepRate: KPIMetric;
}

export interface AllKPIs {
  revenue: RevenueKPIs;
  jobs: JobKPIs;
  clients: ClientKPIs;
  efficiency: EfficiencyKPIs;
  quality: QualityKPIs;
}

export interface KPIDashboard {
  period: KPIPeriod;
  startDate: string;
  endDate: string;
  kpis: AllKPIs;
  summary: {
    totalMetrics: number;
    metricsAboveTarget: number;
    metricsBelowTarget: number;
    averageGrowth: number;
  };
}

export interface KPIReport {
  id: string;
  name: string;
  description: string;
  period: KPIPeriod;
  generatedAt: string;
  metrics: KPIMetric[];
  charts?: {
    type: 'line' | 'bar' | 'pie' | 'gauge';
    data: any;
    title: string;
  }[];
}

export interface KPITarget {
  id: string;
  metricId: string;
  targetValue: number;
  period: KPIPeriod;
  startDate: string;
  endDate?: string;
  createdAt: string;
  achievedAt?: string;
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
}

export interface KPIAlert {
  id: string;
  metricId: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  triggered: boolean;
  triggeredAt?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
