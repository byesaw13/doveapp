'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  RefreshCw,
} from 'lucide-react';

interface TodayStats {
  jobsScheduled: number;
  jobsCompleted: number;
  invoicesDue: number;
  invoicesOverdue: number;
  paymentsReceived: number;
  newLeads: number;
  urgentJobs: number;
}

interface TodayData {
  date: string;
  stats: TodayStats;
  performance?: {
    duration: number;
    queryCount: number;
  };
}

export default function AdminTodayPage() {
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get today's date
  const today = new Date();

  // Load today's stats
  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/today/stats');

      if (response.ok) {
        const data: TodayData = await response.json();
        setTodayData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load today's stats");
      }
    } catch (err) {
      console.error('Error loading today stats:', err);
      setError("Failed to load today's stats");
    } finally {
      setIsLoading(false);
    }
  };

  const todayStats: TodayStats = todayData?.stats || {
    jobsScheduled: 0,
    jobsCompleted: 0,
    invoicesDue: 0,
    invoicesOverdue: 0,
    paymentsReceived: 0,
    newLeads: 0,
    urgentJobs: 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Loading today&apos;s overview...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Data
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadTodayStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Calendar className="h-6 w-6 mr-2" />
              Today&apos;s Overview
            </h1>
            <p className="text-muted-foreground">
              {today.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={loadTodayStats}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {todayData?.performance && (
          <div className="mt-2 text-xs text-muted-foreground">
            Data loaded in {todayData.performance.duration}ms using{' '}
            {todayData.performance.queryCount} database queries
          </div>
        )}
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{todayStats.jobsScheduled}</p>
                <p className="text-sm text-muted-foreground">Jobs Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{todayStats.jobsCompleted}</p>
                <p className="text-sm text-muted-foreground">Jobs Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(todayStats.paymentsReceived)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payments Received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{todayStats.newLeads}</p>
                <p className="text-sm text-muted-foreground">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Urgent Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayStats.urgentJobs > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Urgent Jobs</span>
                </div>
                <Badge variant="destructive">{todayStats.urgentJobs}</Badge>
              </div>
            )}

            {todayStats.invoicesOverdue > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Overdue Invoices</span>
                </div>
                <Badge variant="secondary">{todayStats.invoicesOverdue}</Badge>
              </div>
            )}

            {todayStats.invoicesDue > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Invoices Due Today</span>
                </div>
                <Badge variant="outline">{todayStats.invoicesDue}</Badge>
              </div>
            )}

            {todayStats.urgentJobs === 0 &&
              todayStats.invoicesOverdue === 0 &&
              todayStats.invoicesDue === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>All caught up! No urgent items today.</p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jobs Scheduled</span>
                <Badge variant="outline">{todayStats.jobsScheduled}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jobs Completed</span>
                <Badge variant="secondary">{todayStats.jobsCompleted}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <Badge
                  variant={
                    todayStats.jobsScheduled > 0 &&
                    todayStats.jobsCompleted / todayStats.jobsScheduled >= 0.8
                      ? 'default'
                      : 'outline'
                  }
                >
                  {todayStats.jobsScheduled > 0
                    ? Math.round(
                        (todayStats.jobsCompleted / todayStats.jobsScheduled) *
                          100
                      )
                    : 0}
                  %
                </Badge>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {todayStats.jobsScheduled - todayStats.jobsCompleted} jobs
                remaining today
              </p>
              {todayStats.jobsScheduled > 0 && (
                <div className="mt-2">
                  <Link
                    href="/admin/jobs?date=today"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    View today&apos;s jobs →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-blue-600" />
              Today&apos;s Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayStats.jobsScheduled > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {todayStats.jobsScheduled} jobs scheduled for today
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No jobs scheduled for today
                </p>
              )}
              <div className="flex gap-2">
                <Link
                  href="/admin/jobs?date=today"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View all jobs →
                </Link>
                <Link
                  href="/admin/jobs/new"
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Schedule new job →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Financials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Today&apos;s Financials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Payments Received</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(todayStats.paymentsReceived)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Invoices Due</span>
                <span className="font-semibold">{todayStats.invoicesDue}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overdue Invoices</span>
                <span className="font-semibold text-red-600">
                  {todayStats.invoicesOverdue}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <Link
                href="/admin/invoices?status=due"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View invoices →
              </Link>
              <Link
                href="/admin/invoices?status=overdue"
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                View overdue →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* New Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Today&apos;s Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayStats.newLeads > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {todayStats.newLeads} new leads received today
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/admin/leads?date=today"
                      className="text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      View leads →
                    </Link>
                    <Link
                      href="/admin/leads/new"
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Add new lead →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    No new leads today
                  </p>
                  <Link
                    href="/admin/leads"
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    View all leads →
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {todayStats.jobsScheduled > 0
                    ? Math.round(
                        (todayStats.jobsCompleted / todayStats.jobsScheduled) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Job Completion Rate
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {todayStats.jobsCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600">
                    {todayStats.jobsScheduled - todayStats.jobsCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </div>

            {todayStats.jobsScheduled > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-center">
                  {todayStats.jobsCompleted / todayStats.jobsScheduled >=
                  0.8 ? (
                    <Badge className="bg-green-100 text-green-700">
                      Excellent progress!
                    </Badge>
                  ) : todayStats.jobsCompleted / todayStats.jobsScheduled >=
                    0.5 ? (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      Good progress
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      Needs attention
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/jobs"
              className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <Wrench className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">View Jobs</span>
              </div>
            </Link>

            <Link
              href="/admin/invoices"
              className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Manage Invoices</span>
              </div>
            </Link>

            <Link
              href="/admin/leads"
              className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">Check Leads</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
