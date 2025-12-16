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
} from 'lucide-react';
import { getDashboardStats } from '@/lib/dashboard';

interface TodayStats {
  jobsScheduled: number;
  jobsCompleted: number;
  invoicesDue: number;
  invoicesOverdue: number;
  paymentsReceived: number;
  newLeads: number;
  urgentJobs: number;
}

export default async function AdminTodayPage() {
  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Get dashboard stats (we'll adapt this to show today-specific data)
  const stats = await getDashboardStats();

  // Mock today's specific stats (in a real implementation, these would come from filtered queries)
  const todayStats: TodayStats = {
    jobsScheduled: 8,
    jobsCompleted: 3,
    invoicesDue: 5,
    invoicesOverdue: 2,
    paymentsReceived: 1250.0,
    newLeads: 3,
    urgentJobs: 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
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
            </div>
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
            <a
              href="/admin/jobs"
              className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <Wrench className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">View Jobs</span>
              </div>
            </a>

            <a
              href="/admin/invoices"
              className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Manage Invoices</span>
              </div>
            </a>

            <a
              href="/admin/leads"
              className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium">Check Leads</span>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
