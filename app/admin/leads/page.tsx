'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Inbox,
  List,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import type { LeadStats } from '@/types/lead';

// Import the individual components
import LeadAnalyticsContent from './components/LeadAnalytics';
import LeadListContent from './components/LeadList';

function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'inbox'
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/leads?action=stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Consistent with other admin pages */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track lead capture and conversion
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/admin/leads?tab=inbox')}
            variant="outline"
          >
            <Inbox className="h-4 w-4 mr-2" />
            Lead Inbox
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clean and consistent */}
      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.new_leads}</p>
                  <p className="text-sm text-muted-foreground">New Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats.conversion_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Conversion</p>
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
                    ${Math.round(stats.total_estimated_value / 1000)}k
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pipeline Value
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex gap-2">
            <TabsTrigger
              value="inbox"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Inbox</span>
              {stats && stats.new_leads > 0 && (
                <Badge className="bg-red-500 text-white ml-1 h-5 min-w-5 px-1.5">
                  {stats.new_leads}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">All Leads</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Inbox className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Lead Inbox - Your Command Center
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    All incoming leads from every channel (phone, email,
                    website, etc.) prioritized by urgency and value. Respond
                    fast to win more customers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inbox view with urgency sorting */}
          <LeadListContent
            onStatsUpdate={loadStats}
            sortByUrgency={true}
            autoRefresh={true}
            showUrgencyIndicators={true}
          />
        </TabsContent>

        {/* All Leads Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500 rounded-xl">
                  <List className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    All Leads - Complete History
                  </h2>
                  <p className="text-muted-foreground">
                    Browse, search, and manage all leads regardless of status or
                    date. Full lead details, conversion tools, and bulk actions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <LeadListContent
            onStatsUpdate={loadStats}
            statusFilter={statusFilter}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Lead Analytics - Track What Works
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    See which marketing channels bring the best customers.
                    Conversion rates, average deal value, and ROI by source.
                  </p>
                  <Button
                    onClick={() => router.push('/leads/analytics')}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <LeadAnalyticsContent />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-2">
                💡 Multi-Channel Lead Management Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>
                    <strong>Use the blue + button on mobile</strong> to capture
                    leads while on phone calls (voice-to-text supported)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>
                    <strong>Email leads auto-create</strong> when customers send
                    quote requests - check your inbox frequently
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>
                    <strong>Respond within 5 minutes</strong> to increase
                    conversion by 900% (industry data)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>
                    <strong>Review Analytics weekly</strong> to see which
                    marketing channels work best
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
