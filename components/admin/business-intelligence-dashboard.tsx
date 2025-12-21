'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Users,
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Activity,
  Zap,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
    byService: Array<{ service: string; revenue: number; count: number }>;
    growth: number;
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
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
  };
}

export function BusinessIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/analytics/business?period=${period}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load business metrics.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business metrics.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Loading business intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No business metrics available</p>
        <Button onClick={loadMetrics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Intelligence</h2>
          <p className="text-muted-foreground">
            Advanced analytics and KPIs for data-driven decisions
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as 'month' | 'quarter' | 'year')
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button onClick={loadMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.revenue.total)}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${getGrowthColor(metrics.revenue.growth)}`}
                >
                  {getGrowthIcon(metrics.revenue.growth)}
                  {formatPercentage(Math.abs(metrics.revenue.growth))}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gross Margin
                </p>
                <p className="text-2xl font-bold">
                  {formatPercentage(metrics.profitability.grossMargin)}
                </p>
                <p className="text-sm text-muted-foreground">Profitability</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customer LTV
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.market.customerLifetimeValue)}
                </p>
                <p className="text-sm text-muted-foreground">Lifetime value</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold">
                  {formatPercentage(metrics.operations.completionRate)}
                </p>
                <p className="text-sm text-muted-foreground">Job success</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        {/* Revenue Analysis */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly revenue over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.revenue.monthly.map((month, index) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(month.amount / Math.max(...metrics.revenue.monthly.map((m) => m.amount))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {formatCurrency(month.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Service */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>
                  Performance breakdown by service type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.revenue.byService.map((service) => {
                    const percentage =
                      (service.revenue / metrics.revenue.total) * 100;
                    return (
                      <div key={service.service} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {service.service}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {service.count} jobs •{' '}
                            {formatPercentage(percentage)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-right">
                          <span className="font-medium">
                            {formatCurrency(service.revenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profitability Analysis */}
        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Margin Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Margin Analysis</CardTitle>
                <CardDescription>Gross and net profit margins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gross Margin</span>
                      <span className="font-medium">
                        {formatPercentage(metrics.profitability.grossMargin)}
                      </span>
                    </div>
                    <Progress
                      value={metrics.profitability.grossMargin}
                      className="h-3"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Net Margin</span>
                      <span className="font-medium">
                        {formatPercentage(metrics.profitability.netMargin)}
                      </span>
                    </div>
                    <Progress
                      value={metrics.profitability.netMargin}
                      className="h-3"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Average job margin:{' '}
                    <span className="font-medium">
                      {formatPercentage(metrics.profitability.averageJobMargin)}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Cost distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.profitability.costBreakdown).map(
                    ([category, amount]) => {
                      const percentage =
                        (amount /
                          Object.values(
                            metrics.profitability.costBreakdown
                          ).reduce((a, b) => a + b, 0)) *
                        100;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium capitalize">
                              {category}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatPercentage(percentage)}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="text-right">
                            <span className="font-medium">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Analysis */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operational Metrics */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {metrics.operations.averageJobDuration.toFixed(1)}h
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg Job Duration
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPercentage(
                        metrics.operations.customerRetentionRate
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer Retention
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatPercentage(metrics.operations.repeatBusinessRate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Repeat Business
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Insights</CardTitle>
              <CardDescription>
                Key performance indicators and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700">Strengths</h4>
                  {metrics.operations.completionRate > 90 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Excellent job completion rate</span>
                    </div>
                  )}
                  {metrics.operations.customerRetentionRate > 70 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Strong customer retention</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-orange-700">Opportunities</h4>
                  {metrics.operations.averageJobDuration > 4 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Consider optimizing job duration</span>
                    </div>
                  )}
                  {metrics.operations.repeatBusinessRate < 50 && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Focus on increasing repeat business</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Analysis */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Cash Flow Projection</CardTitle>
                <CardDescription>
                  Expected cash inflows over the next month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.cashflow.projectedCashflow
                    .slice(0, 10)
                    .map((day, index) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>Day {index + 1}</span>
                        <span className="font-medium">
                          {formatCurrency(day.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Health</CardTitle>
                <CardDescription>
                  Key metrics for cash flow management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics.cashflow.daysOutstanding}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Days Outstanding
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {formatCurrency(metrics.cashflow.overdueAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Overdue Amount
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Cash flow health:</span>
                    <Badge
                      variant={
                        metrics.cashflow.daysOutstanding < 30
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {metrics.cashflow.daysOutstanding < 30
                        ? 'Good'
                        : 'Needs Attention'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Analysis */}
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Economics</CardTitle>
                <CardDescription>
                  Customer acquisition and lifetime value metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Customer Acquisition Cost
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(metrics.market.customerAcquisitionCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Customer Lifetime Value
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(metrics.market.customerLifetimeValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">LTV/CAC Ratio</span>
                    <span className="font-semibold">
                      {(
                        metrics.market.customerLifetimeValue /
                        Math.max(metrics.market.customerAcquisitionCost, 1)
                      ).toFixed(1)}
                      x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Strategic insights based on your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.market.customerLifetimeValue >
                  metrics.market.customerAcquisitionCost * 3 ? (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-1">
                        Strong Unit Economics
                      </h4>
                      <p className="text-sm text-green-700">
                        Your customer lifetime value significantly exceeds
                        acquisition costs, indicating a healthy business model.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-1">
                        Focus on Retention
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Consider strategies to increase customer lifetime value
                        through better retention and upsells.
                      </p>
                    </div>
                  )}

                  {metrics.operations.repeatBusinessRate > 60 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-1">
                        Strong Repeat Business
                      </h4>
                      <p className="text-sm text-blue-700">
                        High repeat business rate indicates excellent customer
                        satisfaction and service quality.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
