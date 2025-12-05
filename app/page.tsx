import Link from 'next/link';
import { getDashboardStats } from '@/lib/dashboard';
import { SmartDashboard } from '@/components/SmartDashboard';
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
    <div className="space-y-8">
      {/* Header - Jobber style with welcome banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">
                Good{' '}
                {new Date().getHours() < 12
                  ? 'morning'
                  : new Date().getHours() < 18
                    ? 'afternoon'
                    : 'evening'}
                ! 👋
              </h1>
              <p className="mt-2 text-emerald-50 text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/jobs/new">
                <button className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-500 inline-flex items-center whitespace-nowrap">
                  <Plus className="w-5 h-5 mr-2" />
                  New Job
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Jobber style with better shadows and hover */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Clients Card */}
          <Link href="/clients" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalClients}
              </div>
              <p className="text-sm font-medium text-slate-600">
                Total Clients
              </p>
            </div>
          </Link>

          {/* Jobs Card */}
          <Link href="/jobs" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs font-medium text-purple-600 group-hover:text-purple-700 flex items-center gap-1">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stats.totalJobs}
              </div>
              <p className="text-sm font-medium text-slate-600">Total Jobs</p>
            </div>
          </Link>

          {/* Revenue Card */}
          <Link href="/kpi" className="group">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs font-medium text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1">
                  Details
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-1">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                Total Revenue
              </p>
            </div>
          </Link>

          {/* Outstanding Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                Pending
              </span>
            </div>
            <div className="text-3xl font-bold text-amber-700 mb-1">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-sm font-medium text-slate-600">Outstanding</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Jobber style with better icons */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/calendar" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <Calendar className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                  Calendar
                </span>
              </div>
            </div>
          </Link>

          <Link href="/jobs/new" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <Plus className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                  New Job
                </span>
              </div>
            </div>
          </Link>

          <Link href="/clients" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <Users className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                  Clients
                </span>
              </div>
            </div>
          </Link>

          <Link href="/properties" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <MapPin className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                  Properties
                </span>
              </div>
            </div>
          </Link>

          <Link href="/time-tracking" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <Clock className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                  Time Tracking
                </span>
              </div>
            </div>
          </Link>

          <Link href="/emails" className="group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl transition-colors">
                  <Mail className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-md">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Jobs
                </h2>
              </div>
              <Link
                href="/jobs"
                className="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentJobs?.slice(0, 5).map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-4 rounded-xl hover:bg-slate-50 transition-all border border-slate-100 hover:border-emerald-200 hover:shadow-md"
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
                    <button className="mt-3 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
                      Create your first job
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Properties</h2>
              </div>
              <Link
                href="/properties"
                className="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                    <MapPin className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.totalProperties}
                    </p>
                    <p className="text-sm font-medium text-purple-700 mt-1">
                      Service Locations
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center py-6 px-4">
                <p className="text-sm text-slate-600 mb-4">
                  Track and manage all your service locations
                </p>
                <Link href="/properties">
                  <button className="px-4 py-2 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-semibold rounded-lg transition-all">
                    View All Properties
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Dashboard */}
      <div className="mt-8">
        <SmartDashboard />
      </div>
    </div>
  );
}
