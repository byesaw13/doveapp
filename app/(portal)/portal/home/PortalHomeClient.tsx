'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
} from 'lucide-react';

interface DashboardData {
  user: {
    id: string;
    full_name?: string;
    email?: string;
  };
  upcomingJobs: any[];
  recentEstimates: any[];
  recentInvoices: any[];
  outstandingBalance: number;
}

export default function PortalHomeClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user info
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }
      const { user } = await userResponse.json();

      // Get upcoming jobs
      const jobsResponse = await fetch(
        `/api/portal/jobs?customer_id=${user.id}&status=scheduled&status=in_progress`
      );
      const jobsData = jobsResponse.ok ? await jobsResponse.json() : [];

      // Get recent estimates
      const estimatesResponse = await fetch('/api/portal/estimates');
      const estimatesData = estimatesResponse.ok
        ? await estimatesResponse.json()
        : [];

      // Get recent invoices
      const invoicesResponse = await fetch('/api/portal/invoices');
      const invoicesData = invoicesResponse.ok
        ? await invoicesResponse.json()
        : [];

      // Calculate outstanding balance
      const outstandingBalance = invoicesData
        .filter((invoice: any) => invoice.status !== 'paid')
        .reduce(
          (total: number, invoice: any) => total + (invoice.total || 0),
          0
        );

      setData({
        user,
        upcomingJobs: jobsData.slice(0, 3), // Show only first 3
        recentEstimates: estimatesData.slice(0, 2), // Show only first 2
        recentInvoices: invoicesData.slice(0, 2), // Show only first 2
        outstandingBalance,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="mb-4">{error || 'Failed to load dashboard'}</p>
              <Button onClick={loadDashboardData} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    user,
    upcomingJobs,
    recentEstimates,
    recentInvoices,
    outstandingBalance,
  } = data;
  const displayName = user.full_name || user.email || 'Customer';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {displayName.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your service requests
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Account Status</div>
            <div className="text-lg font-semibold text-accent">
              Active Customer
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Service */}
        {upcomingJobs.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Next Service
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {upcomingJobs[0].title}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">
                    {upcomingJobs[0].service_date
                      ? new Date(
                          upcomingJobs[0].service_date
                        ).toLocaleDateString()
                      : 'TBD'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    className={
                      upcomingJobs[0].status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {upcomingJobs[0].status === 'scheduled'
                      ? 'Scheduled'
                      : 'In Progress'}
                  </Badge>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                View Details
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    No Upcoming Services
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule your next service
                  </p>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Schedule Service
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Outstanding Balance */}
        {outstandingBalance > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Outstanding Balance
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {
                      recentInvoices.filter((inv) => inv.status !== 'paid')
                        .length
                    }{' '}
                    unpaid invoice(s)
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-4">
                ${outstandingBalance.toFixed(2)}
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                Pay Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">All Paid Up</h3>
                  <p className="text-sm text-muted-foreground">
                    No outstanding balances
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-4">
                $0.00
              </div>
              <Button className="w-full" variant="outline">
                View History
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Recent Activity
                </h3>
                <p className="text-sm text-muted-foreground">
                  {recentEstimates.length > 0
                    ? `${recentEstimates.length} pending estimate(s)`
                    : 'No recent activity'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {recentEstimates.length > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Latest Estimate:
                    </span>
                    <span className="font-medium text-foreground">
                      ${recentEstimates[0].total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      className={
                        recentEstimates[0].status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {recentEstimates[0].status === 'approved'
                        ? 'Approved'
                        : 'Pending'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No recent estimates
                </div>
              )}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Need Service?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-6 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
              <AlertCircle className="text-3xl mb-3 text-red-600" />
              <span className="font-semibold text-red-800">Emergency</span>
              <span className="text-sm text-red-600 mt-1">24/7 service</span>
            </button>

            <button className="flex flex-col items-center p-6 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20">
              <Calendar className="text-3xl mb-3 text-primary" />
              <span className="font-semibold text-primary">
                Schedule Service
              </span>
              <span className="text-sm text-primary/70 mt-1">
                Book appointment
              </span>
            </button>

            <button className="flex flex-col items-center p-6 bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors border border-accent/20">
              <FileText className="text-3xl mb-3 text-accent" />
              <span className="font-semibold text-accent">
                Request Estimate
              </span>
              <span className="text-sm text-accent/70 mt-1">Get a quote</span>
            </button>

            <button className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
              <Phone className="text-3xl mb-3 text-blue-600" />
              <span className="font-semibold text-blue-800">Contact Us</span>
              <span className="text-sm text-blue-600 mt-1">Questions?</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Estimates/Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Estimates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Estimates</CardTitle>
              <a
                href="/portal/estimates"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {recentEstimates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No estimates yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEstimates.map((estimate: any) => (
                  <div
                    key={estimate.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {estimate.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {estimate.estimate_number ||
                          `EST-${estimate.id.slice(-6)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ${estimate.total?.toFixed(2) || '0.00'}
                      </div>
                      <Badge
                        className={
                          estimate.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : estimate.status === 'declined'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {estimate.status === 'approved'
                          ? 'Approved'
                          : estimate.status === 'declined'
                            ? 'Declined'
                            : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <a
                href="/portal/invoices"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {invoice.job?.title || 'Service Invoice'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.invoice_number ||
                          `INV-${invoice.id.slice(-6)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ${invoice.total?.toFixed(2) || '0.00'}
                      </div>
                      <Badge
                        className={
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
