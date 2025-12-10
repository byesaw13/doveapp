'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function LeadsPage() {
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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Target className="h-10 w-10" />
                Lead Management
              </h1>
              <p className="text-blue-50 text-lg">
                Multi-channel lead capture and conversion tracking
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push('/leads/inbox')}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                <Inbox className="h-4 w-4 mr-2" />
                Lead Inbox
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar - Now Clickable! */}
          {stats && !loading && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setStatusFilter(null);
                }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stats.total_leads}
                    </div>
                    <div className="text-xs text-blue-100">Total Leads</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('all');
                  setStatusFilter('new');
                }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stats.new_leads}
                    </div>
                    <div className="text-xs text-blue-100">New Leads</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analytics');
                }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stats.conversion_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-100">Conversion</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('all');
                  setStatusFilter('qualified');
                }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      ${Math.round(stats.total_estimated_value / 1000)}k
                    </div>
                    <div className="text-xs text-blue-100">Pipeline Value</div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Inbox className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Lead Inbox - Your Command Center
                </h2>
                <p className="text-slate-700 mb-3">
                  All incoming leads from every channel (phone, email, website,
                  etc.) prioritized by urgency and value. Respond fast to win
                  more customers.
                </p>
              </div>
            </div>
          </div>

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
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border-2 border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <List className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  All Leads - Complete History
                </h2>
                <p className="text-slate-700">
                  Browse, search, and manage all leads regardless of status or
                  date. Full lead details, conversion tools, and bulk actions.
                </p>
              </div>
            </div>
          </div>

          <LeadListContent
            onStatsUpdate={loadStats}
            statusFilter={statusFilter}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Lead Analytics - Track What Works
                </h2>
                <p className="text-slate-700 mb-3">
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
          </div>

          <LeadAnalyticsContent />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              💡 Multi-Channel Lead Management Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
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
      </div>
    </div>
  );
}
