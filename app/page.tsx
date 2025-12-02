import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '@/lib/dashboard';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Package,
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      quote: 'bg-gray-100 text-gray-700 border-gray-300',
      scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      invoiced: 'bg-purple-100 text-purple-700 border-purple-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 rounded-2xl"></div>
          <div className="relative p-8 rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Welcome back! Here's your business overview
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-white text-sm font-medium shadow-md">
                  <CheckCircle className="w-4 h-4" />
                  <span>All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Clients
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalClients}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Active client accounts
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Properties
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalProperties}
              </div>
              <p className="text-xs text-gray-500 mt-1">Service locations</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Jobs
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalJobs}
              </div>
              <p className="text-xs text-gray-500 mt-1">Jobs created</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Revenue
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total job value</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Outstanding
              </CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {formatCurrency(stats.totalOutstanding)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Pending payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Button
              asChild
              className="h-24 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/calendar">
                <Calendar className="h-6 w-6" />
                <span className="text-sm font-medium">Calendar</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all"
            >
              <Link href="/jobs/new">
                <Plus className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  New Job
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 transition-all"
            >
              <Link href="/clients">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  Clients
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 hover:border-orange-300 transition-all"
            >
              <Link href="/jobs">
                <Briefcase className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Jobs</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-green-50 hover:to-teal-50 hover:border-green-300 transition-all"
            >
              <Link href="/time-tracking">
                <Clock className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Time</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 transition-all"
            >
              <Link href="/emails">
                <Mail className="h-6 w-6 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Email</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-2 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 hover:border-gray-300 transition-all"
            >
              <Link href="/inventory">
                <Package className="h-6 w-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Inventory
                </span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Recent Jobs */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Jobs</CardTitle>
                  <CardDescription>Latest job activity</CardDescription>
                </div>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {job.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {job.client.first_name} {job.client.last_name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${getStatusColor(job.status)}`}
                        >
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-green-600">
                          {formatCurrency(job.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs yet</p>
                </div>
              )}
              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Link href="/jobs">
                    View All Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Clients</CardTitle>
                  <CardDescription>Newly added clients</CardDescription>
                </div>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.recentClients.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        {client.company_name && (
                          <p className="text-sm text-gray-600">
                            {client.company_name}
                          </p>
                        )}
                        {client.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {client.email}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-3 whitespace-nowrap">
                        {formatDate(client.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No clients yet</p>
                </div>
              )}
              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Link href="/clients">
                    View All Clients
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Properties */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Properties</CardTitle>
                  <CardDescription>Service locations</CardDescription>
                </div>
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.recentProperties.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {property.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {property.client.first_name}{' '}
                          {property.client.last_name}
                        </p>
                        {property.city && property.state && (
                          <p className="text-xs text-gray-500">
                            {property.city}, {property.state}
                          </p>
                        )}
                      </div>
                      {property.property_type && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 border-green-300 ml-3"
                        >
                          {property.property_type}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No properties yet</p>
                </div>
              )}
              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 hover:bg-green-50 hover:border-green-300"
                >
                  <Link href="/properties">
                    View All Properties
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Status Overview */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Job Status Overview</CardTitle>
                <CardDescription>
                  Current status distribution of all jobs
                </CardDescription>
              </div>
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(stats.jobsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-blue-300 transition-all"
                >
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {count}
                  </div>
                  <div className="text-sm font-medium text-gray-600 capitalize">
                    {status.replace('_', ' ')}
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${(count / stats.totalJobs) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
