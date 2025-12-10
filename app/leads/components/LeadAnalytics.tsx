'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Target,
} from 'lucide-react';
import type { LeadSource } from '@/types/lead';
import { getSourceIcon, getSourceGradient } from '@/lib/lead-utils';

interface SourceStats {
  source: LeadSource;
  total: number;
  converted: number;
  conversion_rate: number;
  avg_value: number;
  avg_time_to_conversion: number;
}

export default function LeadAnalyticsPage() {
  const [stats, setStats] = useState<SourceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/leads/analytics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = stats.reduce((sum, s) => sum + s.total, 0);
  const totalConverted = stats.reduce((sum, s) => sum + s.converted, 0);
  const overallConversionRate =
    totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white">Lead Analytics</h1>
          <p className="text-purple-50 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-white">Lead Source Analytics</h1>
        <p className="text-purple-50 mt-2">
          Track which channels bring the best customers
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900">
              {totalConverted}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-700 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900">
              {overallConversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats
          .sort((a, b) => b.total - a.total)
          .map((source) => {
            const Icon = getSourceIcon(source.source);
            const gradientColor = getSourceGradient(source.source);

            return (
              <Card
                key={source.source}
                className="hover:shadow-xl transition-shadow"
              >
                <CardHeader
                  className={`bg-gradient-to-r ${gradientColor} text-white rounded-t-lg`}
                >
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <Icon className="h-5 w-5" />
                    {source.source.replace('_', ' ')}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Total Leads */}
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-1">
                      Total Leads
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                      {source.total}
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Conversion Rate
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold text-green-600">
                        {source.conversion_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-500">
                        ({source.converted} converted)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(source.conversion_rate, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Average Value */}
                  {source.avg_value > 0 && (
                    <div>
                      <div className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Avg. Value
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">
                        ${source.avg_value.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Avg Time to Conversion */}
                  {source.avg_time_to_conversion > 0 && (
                    <div>
                      <div className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Avg. Time to Convert
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {source.avg_time_to_conversion.toFixed(1)} days
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.length > 0 && (
            <>
              {/* Best performing source */}
              {stats.sort((a, b) => b.conversion_rate - a.conversion_rate)[0]
                .conversion_rate > 0 && (
                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <div className="font-semibold text-slate-900 mb-1">
                    🏆 Best Converting Source
                  </div>
                  <div className="text-sm text-slate-600">
                    Focus more effort on{' '}
                    <span className="font-bold capitalize">
                      {stats[0].source.replace('_', ' ')}
                    </span>{' '}
                    ({stats[0].conversion_rate.toFixed(1)}% conversion rate)
                  </div>
                </div>
              )}

              {/* Most volume */}
              {stats.sort((a, b) => b.total - a.total)[0].total > 10 && (
                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <div className="font-semibold text-slate-900 mb-1">
                    📊 Highest Volume Source
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-bold capitalize">
                      {stats
                        .sort((a, b) => b.total - a.total)[0]
                        .source.replace('_', ' ')}
                    </span>{' '}
                    generates the most leads (
                    {stats.sort((a, b) => b.total - a.total)[0].total} total)
                  </div>
                </div>
              )}

              {/* Highest value */}
              {stats.filter((s) => s.avg_value > 0).length > 0 &&
                stats.sort((a, b) => b.avg_value - a.avg_value)[0].avg_value >
                  1000 && (
                  <div className="p-4 bg-white rounded-lg border border-amber-200">
                    <div className="font-semibold text-slate-900 mb-1">
                      💰 Highest Value Source
                    </div>
                    <div className="text-sm text-slate-600">
                      <span className="font-bold capitalize">
                        {stats
                          .sort((a, b) => b.avg_value - a.avg_value)[0]
                          .source.replace('_', ' ')}
                      </span>{' '}
                      leads have the highest average value ($
                      {stats
                        .sort((a, b) => b.avg_value - a.avg_value)[0]
                        .avg_value.toLocaleString()}
                      )
                    </div>
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
