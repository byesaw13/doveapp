import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/dashboard';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default async function Dashboard() {
  const stats = await getDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Scheduled', className: 'status-badge status-info' },
      in_progress: {
        label: 'In Progress',
        className: 'status-badge status-warning',
      },
      completed: {
        label: 'Completed',
        className: 'status-badge status-success',
      },
      cancelled: {
        label: 'Cancelled',
        className: 'status-badge status-danger',
      },
    };
    return config[status] || { label: status, className: 'status-badge' };
  };

  return (
    <div className="space-y-6">
      {/* Header - Jobber style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back! Here&apos;s what&apos;s happening with your business
            today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/jobs/new">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 font-medium">
              All systems operational
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid - Jobber style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Clients Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <Link
              href="/clients"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalClients}
          </div>
          <p className="text-sm text-slate-600 mt-1">Total Clients</p>
        </div>

        {/* Jobs Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <Link
              href="/jobs"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalJobs}
          </div>
          <p className="text-sm text-slate-600 mt-1">Total Jobs</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <Link
              href="/kpi"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Details →
            </Link>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="text-sm text-slate-600 mt-1">Total Revenue</p>
        </div>

        {/* Outstanding Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">
            {formatCurrency(stats.totalOutstanding)}
          </div>
          <p className="text-sm text-slate-600 mt-1">Outstanding</p>
        </div>
      </div>

      {/* Quick Actions - Jobber style */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/calendar">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Calendar
                </span>
              </div>
            </div>
          </Link>

          <Link href="/jobs/new">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Plus className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  New Job
                </span>
              </div>
            </div>
          </Link>

          <Link href="/clients">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Users className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Clients
                </span>
              </div>
            </div>
          </Link>

          <Link href="/properties">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Properties
                </span>
              </div>
            </div>
          </Link>

          <Link href="/time-tracking">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Clock className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Time Tracking
                </span>
              </div>
            </div>
          </Link>

          <Link href="/emails">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all hover:border-emerald-200 cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Jobs and Upcoming - Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent Jobs
              </CardTitle>
              <Link href="/jobs">
                <Button variant="ghost" size="sm" className="text-emerald-600">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentJobs?.slice(0, 5).map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {job.client?.first_name} {job.client?.last_name}
                      </p>
                    </div>
                    <span className={getStatusBadge(job.status).className}>
                      {getStatusBadge(job.status).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(job.created_at)}
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(job.total || 0)}
                    </span>
                  </div>
                </Link>
              ))}
              {(!stats.recentJobs || stats.recentJobs.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No jobs yet</p>
                  <Link href="/jobs/new">
                    <Button
                      size="sm"
                      className="mt-3 bg-emerald-500 hover:bg-emerald-600"
                    >
                      Create your first job
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Properties
              </CardTitle>
              <Link href="/properties">
                <Button variant="ghost" size="sm" className="text-emerald-600">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.totalProperties}
                    </p>
                    <p className="text-sm text-slate-600">
                      Total service locations
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm mb-3">
                  Manage all your service locations
                </p>
                <Link href="/properties">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    View Properties
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
