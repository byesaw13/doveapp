'use client';

import { useState, useEffect } from 'react';
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {metric.name}
            </p>
            {metric.description && (
              <p className="text-xs text-slate-500 mt-1">
                {metric.description}
              </p>
            )}
          </div>
          <div className="p-2 bg-slate-100 rounded-lg ml-3">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">
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
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>
                  Target: {formatValue({ ...metric, value: metric.target! })}
                </span>
                <span
                  className={
                    isAboveTarget
                      ? 'text-emerald-600 font-medium'
                      : 'text-slate-600'
                  }
                >
                  {metric.targetProgress?.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header - Jobber style with emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">
                  Key Performance Indicators
                </h1>
                <p className="mt-2 text-emerald-50 text-sm">
                  Loading KPI data...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <div className="text-slate-600">Loading KPIs...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="space-y-6">
        {/* Header - Jobber style with emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">
                  Key Performance Indicators
                </h1>
                <p className="mt-2 text-emerald-50 text-sm">
                  Failed to load KPI data
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Failed to load KPIs
            </h3>
            <p className="text-sm text-slate-600">
              Please try refreshing the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">
                Key Performance Indicators
              </h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Track your business metrics and performance goals
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <button
                onClick={loadKPIs}
                className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-500 inline-flex items-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Time Period</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            ['day', 'week', 'month', 'quarter', 'year', 'all'] as KPIPeriod[]
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                period === p
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {p === 'all'
                ? 'All Time'
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
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

      {/* Summary Cards - Jobber style */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Metrics Above Target Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-green-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {dashboard.summary.metricsAboveTarget}
          </div>
          <p className="text-sm font-medium text-slate-600">Above Target</p>
          <p className="text-xs text-slate-500 mt-1">
            out of {dashboard.summary.totalMetrics} total metrics
          </p>
        </div>

        {/* Below Target Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-red-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {dashboard.summary.metricsBelowTarget}
          </div>
          <p className="text-sm font-medium text-slate-600">Below Target</p>
          <p className="text-xs text-slate-500 mt-1">needs improvement</p>
        </div>

        {/* Average Growth Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-700 mb-1">
            {dashboard.summary.averageGrowth.toFixed(1)}%
          </div>
          <p className="text-sm font-semibold text-emerald-600">
            Average Growth
          </p>
          <p className="text-xs text-emerald-600 mt-1">vs previous period</p>
        </div>

        {/* Total Metrics Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {dashboard.summary.totalMetrics}
          </div>
          <p className="text-sm font-medium text-slate-600">Total Metrics</p>
          <p className="text-xs text-slate-500 mt-1">tracked indicators</p>
        </div>
      </div>

      {/* Revenue KPIs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Revenue Metrics
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {Object.keys(dashboard.kpis.revenue).length} metrics
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.revenue).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Job KPIs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Job Performance
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {Object.keys(dashboard.kpis.jobs).length} metrics
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.jobs).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Client KPIs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Client Analytics
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {Object.keys(dashboard.kpis.clients).length} metrics
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.clients).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Efficiency KPIs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Efficiency Metrics
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {Object.keys(dashboard.kpis.efficiency).length} metrics
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.values(dashboard.kpis.efficiency).map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Quality KPIs - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Quality Indicators
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {Object.keys(dashboard.kpis.quality).length} metrics
            </span>
          </div>
        </div>
        <div className="p-6">
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
