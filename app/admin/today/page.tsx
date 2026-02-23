'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  PageHeader,
  PageContainer,
  ContentSection,
  EmptyState,
  Spinner,
  StatusBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetricCard,
} from '@/components/ui';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Wrench,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { JobWithClient, JobStatus } from '@/types/job';

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

const statusVariantMap: Record<
  JobStatus,
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'quote'
  | 'draft'
  | 'invoiced'
> = {
  draft: 'draft',
  quote: 'quote',
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  invoiced: 'invoiced',
  cancelled: 'cancelled',
};

export default function AdminTodayPage() {
  const [todayData, setTodayData] = React.useState<TodayData | null>(null);
  const [todayJobs, setTodayJobs] = React.useState<JobWithClient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const today = new Date();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/admin/today/stats'),
        fetch(
          `/api/jobs?dateFrom=${format(today, 'yyyy-MM-dd')}&dateTo=${format(today, 'yyyy-MM-dd')}`
        ),
      ]);

      if (statsRes.ok) {
        const data: TodayData = await statsRes.json();
        setTodayData(data);
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const jobs = Array.isArray(data) ? data : data.jobs || [];
        setTodayJobs(jobs);
      }
    } catch (err) {
      console.error('Error loading today data:', err);
      setError("Failed to load today's data");
    } finally {
      setIsLoading(false);
    }
  };

  const stats: TodayStats = todayData?.stats || {
    jobsScheduled: 0,
    jobsCompleted: 0,
    invoicesDue: 0,
    invoicesOverdue: 0,
    paymentsReceived: 0,
    newLeads: 0,
    urgentJobs: 0,
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const todayJobsList = todayJobs.filter(
    (j) => j.service_date && isToday(new Date(j.service_date))
  );
  const upcomingJobs = todayJobs
    .filter((j) => j.service_date && isFuture(new Date(j.service_date)))
    .slice(0, 5);
  const overdueJobs = todayJobs.filter(
    (j) =>
      j.service_date &&
      isPast(new Date(j.service_date)) &&
      !isToday(new Date(j.service_date)) &&
      j.status !== 'completed' &&
      j.status !== 'cancelled'
  );

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Error Loading Data"
          description={error}
          action={{ label: 'Try Again', onClick: loadData }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" padding="md">
      <PageHeader
        title="Today"
        description={format(today, 'EEEE, MMMM d, yyyy')}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Today' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Jobs Today"
          value={todayJobsList.length}
          icon={<Wrench className="h-5 w-5" />}
          className="bg-blue-50 dark:bg-blue-950/30"
        />
        <MetricCard
          title="Completed"
          value={todayJobsList.filter((j) => j.status === 'completed').length}
          icon={<CheckCircle className="h-5 w-5" />}
          className="bg-green-50 dark:bg-green-950/30"
        />
        <MetricCard
          title="Payments"
          value={formatCurrency(stats.paymentsReceived)}
          icon={<DollarSign className="h-5 w-5" />}
          className="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <MetricCard
          title="New Leads"
          value={stats.newLeads}
          icon={<Users className="h-5 w-5" />}
          className="bg-purple-50 dark:bg-purple-950/30"
        />
      </div>

      {(stats.invoicesOverdue > 0 || stats.urgentJobs > 0) && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-700 dark:text-red-400">
              Attention Required
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.invoicesOverdue > 0 && (
              <Link
                href="/admin/invoices?status=overdue"
                className="text-red-600 hover:underline"
              >
                {stats.invoicesOverdue} overdue invoice
                {stats.invoicesOverdue !== 1 ? 's' : ''}
              </Link>
            )}
            {stats.urgentJobs > 0 && (
              <Link
                href="/admin/jobs?priority=high"
                className="text-red-600 hover:underline"
              >
                {stats.urgentJobs} urgent job{stats.urgentJobs !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Today&apos;s Jobs
              </CardTitle>
              <Link
                href="/admin/jobs"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {todayJobsList.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No jobs scheduled for today</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/admin/jobs/new">Schedule Job</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {todayJobsList.map((job) => (
                    <Link
                      key={job.id}
                      href={`/admin/jobs/${job.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{job.job_number}</span>
                          <StatusBadge
                            variant={statusVariantMap[job.status]}
                            size="sm"
                            dot
                          >
                            {job.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${job.total.toLocaleString()}
                        </p>
                        {job.scheduled_time && (
                          <p className="text-xs text-muted-foreground">
                            {job.scheduled_time}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {overdueJobs.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Overdue Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {overdueJobs.slice(0, 5).map((job) => (
                    <Link
                      key={job.id}
                      href={`/admin/jobs/${job.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{job.job_number}</span>
                          <StatusBadge
                            variant={statusVariantMap[job.status]}
                            size="sm"
                            dot
                          >
                            {job.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.title}
                        </p>
                      </div>
                      <div className="text-right text-sm text-red-600">
                        <p>
                          {job.service_date
                            ? format(new Date(job.service_date), 'MMM d')
                            : 'No date'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {upcomingJobs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {upcomingJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/admin/jobs/${job.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{job.job_number}</span>
                          <StatusBadge
                            variant={statusVariantMap[job.status]}
                            size="sm"
                            dot
                          >
                            {job.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.title}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>
                          {job.service_date
                            ? format(new Date(job.service_date), 'MMM d')
                            : 'No date'}
                        </p>
                        {job.scheduled_time && (
                          <p className="text-xs">{job.scheduled_time}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Jobs Completed
                    </span>
                    <span className="font-medium">
                      {
                        todayJobsList.filter((j) => j.status === 'completed')
                          .length
                      }{' '}
                      / {todayJobsList.length}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          todayJobsList.length > 0
                            ? (todayJobsList.filter(
                                (j) => j.status === 'completed'
                              ).length /
                                todayJobsList.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/jobs/new">
                  <Briefcase className="h-4 w-4 mr-2" />
                  New Job
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/invoices?status=due">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Due Invoices
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/leads">
                  <Users className="h-4 w-4 mr-2" />
                  View Leads
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payments Today</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.paymentsReceived)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoices Due</span>
                <span>{stats.invoicesDue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="text-red-600">{stats.invoicesOverdue}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
