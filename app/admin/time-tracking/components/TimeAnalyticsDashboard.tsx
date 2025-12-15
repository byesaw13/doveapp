'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

interface TimeTrackingAnalytics {
  total_hours_today: number;
  total_hours_week: number;
  total_hours_month: number;
  active_technicians: number;
  pending_approvals: number;
  avg_hourly_rate: number;
  total_billed_today: number;
  productivity_trends: Array<{
    date: string;
    hours: number;
    technicians: number;
  }>;
  technician_performance: Array<{
    technician_name: string;
    total_hours: number;
    avg_rating: number;
    on_time_percentage: number;
  }>;
}

export function TimeAnalyticsDashboard() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<TimeTrackingAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/time-tracking?action=analytics&date_range=${dateRange}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Time Analytics</h2>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground">
            Unable to load analytics data. Please try again.
          </p>
          <Button onClick={loadAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Analytics</h2>
          <p className="text-muted-foreground">
            Insights into time tracking and productivity
          </p>
        </div>

        <Select
          value={dateRange}
          onValueChange={(value: any) => setDateRange(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(analytics.total_hours_today)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.total_billed_today)} billed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dateRange === 'week'
                ? 'Hours This Week'
                : dateRange === 'month'
                  ? 'Hours This Month'
                  : dateRange === 'quarter'
                    ? 'Hours This Quarter'
                    : 'Hours This Year'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(
                dateRange === 'week'
                  ? analytics.total_hours_week
                  : dateRange === 'month'
                    ? analytics.total_hours_month
                    : analytics.total_hours_month // fallback
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(analytics.avg_hourly_rate)}/hr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Technicians
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.active_technicians}
            </div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.pending_approvals}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trends</CardTitle>
          <CardDescription>Hours worked over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.productivity_trends.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                      })}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.technicians} technician
                      {day.technicians !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatHours(day.hours)}</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((day.hours / 10) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technician Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
          <CardDescription>Top performers by hours worked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.technician_performance.map((tech, index) => (
              <div
                key={tech.technician_name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-primary">
                      {tech.technician_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{tech.technician_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatHours(tech.total_hours)} worked
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">Rating:</span>
                    <Badge variant="secondary">
                      {tech.avg_rating.toFixed(1)} ⭐
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(tech.on_time_percentage)}% on time
                  </div>
                </div>
              </div>
            ))}
            {analytics.technician_performance.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No technician data available for the selected period.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
