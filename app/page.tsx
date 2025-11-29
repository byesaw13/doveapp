import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/dashboard';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your DoveApp dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active client accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">Service locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">Jobs created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Total job value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount remaining to be paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/properties">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">
              <Users className="mr-2 h-4 w-4" />
              View Clients
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/properties">
              <Briefcase className="mr-2 h-4 w-4" />
              View Properties
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              View Jobs
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest job activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length > 0 ? (
              <div className="space-y-4">
                {stats.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.client.first_name} {job.client.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(job.total)}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {job.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No jobs yet</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/jobs">View All Jobs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
            <CardDescription>Newly added clients</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentClients.length > 0 ? (
              <div className="space-y-4">
                {stats.recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {client.first_name} {client.last_name}
                      </p>
                      {client.company_name && (
                        <p className="text-sm text-muted-foreground">
                          {client.company_name}
                        </p>
                      )}
                      {client.email && (
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No clients yet</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/clients">View All Clients</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
            <CardDescription>Newly added service locations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentProperties.length > 0 ? (
              <div className="space-y-4">
                {stats.recentProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.client.first_name} {property.client.last_name}
                      </p>
                      {property.city && property.state && (
                        <p className="text-sm text-muted-foreground">
                          {property.city}, {property.state}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {property.property_type && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {property.property_type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No properties yet</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/properties">View All Properties</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Status Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Job Status Overview</CardTitle>
          <CardDescription>Current status of all jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(stats.jobsByStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
