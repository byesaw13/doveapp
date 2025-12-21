'use client';

import { useState } from 'react';
import { AdvancedSearch } from '@/components/ui/advanced-search';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  FileText,
  Building,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();

  const handleResultSelect = (result: any) => {
    // Navigate to the appropriate detail page based on result type
    switch (result.type) {
      case 'client':
        router.push(`/admin/clients?highlight=${result.id}`);
        break;
      case 'job':
        router.push(`/admin/jobs/${result.id}`);
        break;
      case 'estimate':
        router.push(`/admin/estimates/${result.id}`);
        break;
      case 'property':
        // Properties might not have a detail page yet
        router.push(`/admin/clients?property=${result.id}`);
        break;
      default:
        console.log('Unknown result type:', result.type);
    }
  };

  const searchStats = [
    { type: 'clients', count: 0, icon: Users, color: 'bg-blue-500' },
    { type: 'jobs', count: 0, icon: Briefcase, color: 'bg-green-500' },
    { type: 'estimates', count: 0, icon: FileText, color: 'bg-yellow-500' },
    { type: 'properties', count: 0, icon: Building, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="mt-2 text-blue-100">
            Find anything in your business data with powerful search and
            filtering
          </p>
        </div>

        {/* Search Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {searchStats.map((stat) => (
            <Card key={stat.type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {stat.type}
                    </p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Component */}
        <AdvancedSearch
          onResultSelect={handleResultSelect}
          placeholder="Search clients, jobs, estimates, properties..."
        />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common searches and actions to speed up your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/search?q=overdue')}
              >
                <div className="text-left">
                  <div className="font-medium">Overdue Invoices</div>
                  <div className="text-sm text-muted-foreground">
                    Find unpaid invoices past due
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/search?q=urgent')}
              >
                <div className="text-left">
                  <div className="font-medium">Urgent Jobs</div>
                  <div className="text-sm text-muted-foreground">
                    Find high-priority jobs
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/search?q=recent')}
              >
                <div className="text-left">
                  <div className="font-medium">Recent Activity</div>
                  <div className="text-sm text-muted-foreground">
                    Find recently created items
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/clients')}
              >
                <div className="text-left">
                  <div className="font-medium">Client Directory</div>
                  <div className="text-sm text-muted-foreground">
                    Browse all clients
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/jobs')}
              >
                <div className="text-left">
                  <div className="font-medium">Job Management</div>
                  <div className="text-sm text-muted-foreground">
                    View and manage jobs
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push('/admin/estimates')}
              >
                <div className="text-left">
                  <div className="font-medium">Estimates</div>
                  <div className="text-sm text-muted-foreground">
                    Manage estimates and quotes
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
