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
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Star,
  Clock,
  Target,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface CustomerAnalytics {
  customerId: string;
  totalJobs: number;
  totalRevenue: number;
  averageJobValue: number;
  lifetimeValue: number;
  firstJobDate: string;
  lastJobDate: string;
  jobFrequency: number;
  repeatBusinessRate: number;
  customerSegment: 'new' | 'regular' | 'vip' | 'inactive';
  nextPredictedJob?: string;
}

interface SegmentSummary {
  segment: string;
  customerCount: number;
  totalRevenue: number;
  averageLifetimeValue: number;
  averageJobFrequency: number;
  retentionRate: number;
}

interface RetentionMetrics {
  totalCustomers: number;
  activeCustomers: number;
  retainedCustomers: number;
  churnRate: number;
  averageRetentionPeriod: number;
}

interface AnalyticsData {
  segments: SegmentSummary[];
  topCustomers: CustomerAnalytics[];
  retention: RetentionMetrics;
  summary: {
    totalSegments: number;
    totalHighValueCustomers: number;
    overallRetentionRate: number;
  };
}

export function CustomerAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        '/api/admin/analytics/customers?type=overview'
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load customer analytics.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer analytics.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'regular':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'new':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'vip':
        return <Award className="h-4 w-4" />;
      case 'regular':
        return <TrendingUp className="h-4 w-4" />;
      case 'new':
        return <Star className="h-4 w-4" />;
      case 'inactive':
        return <Clock className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading customer analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={loadAnalytics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const filteredSegments =
    selectedSegment === 'all'
      ? analytics.segments
      : analytics.segments.filter((s) => s.segment === selectedSegment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Analytics</h2>
          <p className="text-muted-foreground">
            Insights into customer lifetime value and repeat business
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  $
                  {analytics.segments
                    .reduce((sum, s) => sum + s.totalRevenue, 0)
                    .toLocaleString()}
                </p>
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
                  Avg Lifetime Value
                </p>
                <p className="text-2xl font-bold">
                  $
                  {Math.round(
                    analytics.segments.reduce(
                      (sum, s) => sum + s.averageLifetimeValue,
                      0
                    ) / analytics.segments.length
                  ).toLocaleString()}
                </p>
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
                  Retention Rate
                </p>
                <p className="text-2xl font-bold">
                  {analytics.retention.retainedCustomers > 0
                    ? Math.round(
                        (analytics.retention.retainedCustomers /
                          analytics.retention.totalCustomers) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  VIP Customers
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.totalHighValueCustomers}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
        </TabsList>

        {/* Customer Segments */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              <option value="all">All Segments</option>
              <option value="vip">VIP Customers</option>
              <option value="regular">Regular Customers</option>
              <option value="new">New Customers</option>
              <option value="inactive">Inactive Customers</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredSegments.map((segment) => (
              <Card key={segment.segment}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    {getSegmentIcon(segment.segment)}
                    {segment.segment} Customers
                    <Badge className={getSegmentColor(segment.segment)}>
                      {segment.customerCount}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {segment.segment === 'vip' &&
                      'High-value customers with frequent jobs'}
                    {segment.segment === 'regular' &&
                      'Consistent customers with multiple jobs'}
                    {segment.segment === 'new' &&
                      'Recent customers with limited history'}
                    {segment.segment === 'inactive' &&
                      "Customers who haven't returned recently"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-lg font-semibold">
                        ${segment.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg Lifetime Value
                      </p>
                      <p className="text-lg font-semibold">
                        $
                        {Math.round(
                          segment.averageLifetimeValue
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Job Frequency
                      </p>
                      <p className="text-lg font-semibold">
                        {segment.averageJobFrequency.toFixed(1)}/month
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Retention Rate
                      </p>
                      <p className="text-lg font-semibold">
                        {Math.round(segment.retentionRate)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Revenue Contribution</span>
                      <span>
                        {Math.round(
                          (segment.totalRevenue /
                            analytics.segments.reduce(
                              (sum, s) => sum + s.totalRevenue,
                              0
                            )) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (segment.totalRevenue /
                          analytics.segments.reduce(
                            (sum, s) => sum + s.totalRevenue,
                            0
                          )) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Customers */}
        <TabsContent value="top-customers" className="space-y-4">
          <div className="space-y-4">
            {analytics.topCustomers.map((customer, index) => (
              <Card key={customer.customerId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">
                          Customer {customer.customerId.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.totalJobs} jobs • $
                          {customer.totalRevenue.toLocaleString()} total
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        className={getSegmentColor(customer.customerSegment)}
                      >
                        {customer.customerSegment.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        ${Math.round(customer.lifetimeValue).toLocaleString()}{' '}
                        CLV
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg Job Value
                      </p>
                      <p className="font-medium">
                        ${Math.round(customer.averageJobValue).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Job Frequency
                      </p>
                      <p className="font-medium">
                        {customer.jobFrequency.toFixed(1)}/month
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Repeat Business
                      </p>
                      <p className="font-medium">
                        {Math.round(customer.repeatBusinessRate)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Retention Analysis */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Metrics</CardTitle>
                <CardDescription>
                  Analysis of customer loyalty and return business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {analytics.retention.retainedCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Retained Customers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {analytics.retention.activeCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active (6 months)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {Math.round(analytics.retention.churnRate)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Churn Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round(analytics.retention.averageRetentionPeriod)}{' '}
                      months
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Retention Period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Insights</CardTitle>
                <CardDescription>
                  Key findings and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Strong Retention</p>
                      <p className="text-sm text-muted-foreground">
                        {analytics.retention.retainedCustomers >
                        analytics.retention.totalCustomers * 0.5
                          ? 'Excellent'
                          : 'Good'}{' '}
                        repeat business rate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium">Active Customer Base</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(
                          (analytics.retention.activeCustomers /
                            analytics.retention.totalCustomers) *
                            100
                        )}
                        % of customers active in last 6 months
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${analytics.retention.churnRate > 30 ? 'bg-red-500' : 'bg-yellow-500'}`}
                    ></div>
                    <div>
                      <p className="font-medium">Churn Prevention</p>
                      <p className="text-sm text-muted-foreground">
                        {analytics.retention.churnRate > 30
                          ? 'High churn rate - focus on retention'
                          : 'Manageable churn - maintain current strategies'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Concentration</CardTitle>
                <CardDescription>
                  How much revenue comes from different customer segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.segments
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((segment) => {
                      const percentage =
                        (segment.totalRevenue /
                          analytics.segments.reduce(
                            (sum, s) => sum + s.totalRevenue,
                            0
                          )) *
                        100;
                      return (
                        <div
                          key={segment.segment}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {getSegmentIcon(segment.segment)}
                            <span className="capitalize font-medium">
                              {segment.segment}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ${segment.totalRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Opportunities</CardTitle>
                <CardDescription>
                  Strategies to increase customer lifetime value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">
                      Convert New Customers
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Focus on turning new customers into regular ones through
                      follow-up and maintenance programs.
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      Upsell to VIP Segment
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Target regular customers with premium services to increase
                      their lifetime value.
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">
                      Reactivate Inactive Customers
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Reach out to inactive customers with special offers to
                      bring them back.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
