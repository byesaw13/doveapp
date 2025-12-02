'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { KPIDashboard, KPIMetric, KPIPeriod } from '@/types/kpi';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Star,
  Target,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';

export default function KPIPage() {
  const [dashboard, setDashboard] = useState<KPIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<KPIPeriod>('month');

  useEffect(() => {
    loadKPIs();
  }, [period]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kpi?period=${period}`);
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (metric: KPIMetric) => {
    switch (metric.unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(metric.value);
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'hours':
        return `${metric.value.toFixed(1)}h`;
      case 'days':
        return `${metric.value.toFixed(1)}d`;
      default:
        return metric.value.toFixed(0);
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return DollarSign;
      case 'jobs':
        return Briefcase;
      case 'clients':
        return Users;
      case 'efficiency':
        return Clock;
      case 'quality':
        return Star;
      default:
        return BarChart3;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'from-green-500 to-emerald-600';
      case 'jobs':
        return 'from-blue-500 to-indigo-600';
      case 'clients':
        return 'from-purple-500 to-pink-600';
      case 'efficiency':
        return 'from-orange-500 to-red-600';
      case 'quality':
        return 'from-yellow-500 to-amber-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const MetricCard = ({ metric }: { metric: KPIMetric }) => {
    const Icon = getCategoryIcon(metric.category);
    const hasTarget = metric.target !== undefined;
    const isAboveTarget = hasTarget && metric.value >= metric.target!;

    return (
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all">
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getCategoryColor(metric.category)} opacity-10 rounded-full -mr-16 -mt-16`}
        ></div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              {metric.description && (
                <p className="text-xs text-gray-400 mt-1">
                  {metric.description}
                </p>
              )}
            </div>
            <div
              className={`p-2 bg-gradient-to-br ${getCategoryColor(metric.category)} rounded-lg`}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-gray-900">
                {formatValue(metric)}
              </div>
              {metric.changePercent !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(metric.trend)}`}
                >
                  {getTrendIcon(metric.trend)}
                  <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {hasTarget && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    Target: {formatValue({ ...metric, value: metric.target! })}
                  </span>
                  <span
                    className={
                      isAboveTarget
                        ? 'text-green-600 font-medium'
                        : 'text-gray-600'
                    }
                  >
                    {metric.targetProgress?.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getCategoryColor(metric.category)} transition-all`}
                    style={{
                      width: `${Math.min(metric.targetProgress || 0, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading KPIs...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load KPIs</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pb-12">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Key Performance Indicators
              </h1>
              <p className="text-gray-600 mt-2">
                Track your business metrics and performance goals
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={loadKPIs} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex flex-wrap gap-2">
            {(
              ['day', 'week', 'month', 'quarter', 'year', 'all'] as KPIPeriod[]
            ).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="capitalize"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {p === 'all' ? 'All Time' : p}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metrics Above Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {dashboard.summary.metricsAboveTarget}
              </div>
              <p className="text-green-100 text-sm mt-1">
                out of {dashboard.summary.totalMetrics} total metrics
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Below Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {dashboard.summary.metricsBelowTarget}
              </div>
              <p className="text-red-100 text-sm mt-1">needs improvement</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Average Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {dashboard.summary.averageGrowth.toFixed(1)}%
              </div>
              <p className="text-blue-100 text-sm mt-1">vs previous period</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Total Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {dashboard.summary.totalMetrics}
              </div>
              <p className="text-purple-100 text-sm mt-1">tracked indicators</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue KPIs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Revenue Metrics
            </h2>
            <Badge className="bg-green-100 text-green-700">
              {Object.keys(dashboard.kpis.revenue).length} metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.revenue).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        {/* Job KPIs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Job Performance
            </h2>
            <Badge className="bg-blue-100 text-blue-700">
              {Object.keys(dashboard.kpis.jobs).length} metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.jobs).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        {/* Client KPIs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Client Analytics
            </h2>
            <Badge className="bg-purple-100 text-purple-700">
              {Object.keys(dashboard.kpis.clients).length} metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.clients).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        {/* Efficiency KPIs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Efficiency Metrics
            </h2>
            <Badge className="bg-orange-100 text-orange-700">
              {Object.keys(dashboard.kpis.efficiency).length} metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.efficiency).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        {/* Quality KPIs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Quality Indicators
            </h2>
            <Badge className="bg-yellow-100 text-yellow-700">
              {Object.keys(dashboard.kpis.quality).length} metrics
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.quality).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
