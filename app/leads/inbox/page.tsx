'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  Phone,
  Mail,
  MessageSquare,
  Globe,
  UserPlus,
  Share2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Send,
  FileText,
  Users,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Lead } from '@/types/lead';

interface LeadInboxItem extends Lead {
  source_icon: any;
  source_color: string;
  time_ago: string;
  urgency_score: number;
}

export default function LeadInboxPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'urgent'>(
    'all'
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeads();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads/inbox');
      const data = await response.json();

      // Enrich leads with inbox-specific data
      const enrichedLeads: LeadInboxItem[] = data.map((lead: Lead) => ({
        ...lead,
        source_icon: getSourceIcon(lead.source),
        source_color: getSourceColor(lead.source),
        time_ago: formatDistanceToNow(new Date(lead.created_at), {
          addSuffix: true,
        }),
        urgency_score: calculateUrgencyScore(lead),
      }));

      // Sort by urgency and recency
      enrichedLeads.sort((a, b) => {
        if (a.urgency_score !== b.urgency_score) {
          return b.urgency_score - a.urgency_score;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setLeads(enrichedLeads);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lead inbox',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeads();
  };

  const calculateUrgencyScore = (lead: Lead): number => {
    let score = 0;

    // Priority scoring
    if (lead.priority === 'urgent') score += 100;
    if (lead.priority === 'high') score += 75;
    if (lead.priority === 'medium') score += 50;

    // Status scoring (new leads are more urgent)
    if (lead.status === 'new') score += 50;

    // High-value leads
    if (lead.estimated_value && lead.estimated_value > 5000) score += 25;
    if (lead.estimated_value && lead.estimated_value > 10000) score += 25;

    // Recency bonus
    const hoursSinceCreated =
      (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated < 1) score += 30;
    else if (hoursSinceCreated < 4) score += 20;
    else if (hoursSinceCreated < 24) score += 10;

    return score;
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, any> = {
      phone: Phone,
      email: Mail,
      website: Globe,
      social_media: Share2,
      referral: UserPlus,
      walk_in: Users,
      advertisement: TrendingUp,
      other: MessageSquare,
    };
    return icons[source] || MessageSquare;
  };

  const getSourceColor = (source: string): string => {
    const colors: Record<string, string> = {
      phone: 'bg-blue-100 text-blue-700 border-blue-300',
      email: 'bg-purple-100 text-purple-700 border-purple-300',
      website: 'bg-green-100 text-green-700 border-green-300',
      social_media: 'bg-pink-100 text-pink-700 border-pink-300',
      referral: 'bg-orange-100 text-orange-700 border-orange-300',
      walk_in: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      advertisement: 'bg-amber-100 text-amber-700 border-amber-300',
      other: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[source] || colors.other;
  };

  const handleCallLead = (lead: LeadInboxItem) => {
    window.location.href = `tel:${lead.phone}`;
    // Update last contact
    updateLeadStatus(lead.id, 'contacted');
  };

  const handleTextLead = (lead: LeadInboxItem) => {
    window.location.href = `sms:${lead.phone}`;
    updateLeadStatus(lead.id, 'contacted');
  };

  const handleEmailLead = (lead: LeadInboxItem) => {
    window.location.href = `mailto:${lead.email}`;
    updateLeadStatus(lead.id, 'contacted');
  };

  const handleCreateEstimate = (lead: LeadInboxItem) => {
    sessionStorage.setItem(
      'newEstimate',
      JSON.stringify({
        client_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company_name,
        service_description: lead.service_description,
        estimated_value: lead.estimated_value,
      })
    );
    window.location.href = '/estimates';
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          last_contact_date: new Date().toISOString(),
        }),
      });
      loadLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'all') return true;
    if (filter === 'new') return lead.status === 'new';
    if (filter === 'contacted')
      return lead.status === 'contacted' || lead.status === 'qualified';
    if (filter === 'urgent') return lead.urgency_score > 100;
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    urgent: leads.filter((l) => l.urgency_score > 100).length,
    high_value: leads.filter((l) => (l.estimated_value || 0) > 5000).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-white">Lead Inbox</h1>
          <p className="text-blue-50 mt-2">Loading your leads...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-slate-600">Loading leads...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="h-8 w-8" />
                Lead Inbox
              </h1>
              <p className="text-blue-50 mt-2">
                All incoming leads from every channel
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              New & Uncontacted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.new}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {stats.urgent}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              High Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {stats.high_value}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center bg-white p-4 rounded-lg border border-slate-200">
        <Filter className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-medium text-slate-600 mr-2">Filter:</span>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('new')}
        >
          New
        </Button>
        <Button
          variant={filter === 'contacted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('contacted')}
        >
          Contacted
        </Button>
        <Button
          variant={filter === 'urgent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('urgent')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Urgent Only
        </Button>
      </div>

      {/* Lead Feed */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-600">
              No leads matching your current filter. Great job!
            </p>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className={`hover:shadow-lg transition-all ${
                lead.urgency_score > 100
                  ? 'border-l-4 border-l-red-500'
                  : lead.status === 'new'
                    ? 'border-l-4 border-l-blue-500'
                    : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Lead Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </h3>
                      <Badge className={lead.source_color}>
                        <lead.source_icon className="h-3 w-3 mr-1" />
                        {lead.source.replace('_', ' ')}
                      </Badge>
                      {lead.urgency_score > 100 && (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      {lead.status === 'new' && (
                        <Badge className="bg-blue-100 text-blue-700">New</Badge>
                      )}
                    </div>

                    {lead.company_name && (
                      <p className="text-slate-600 mb-2">{lead.company_name}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4" />
                        {lead.time_ago}
                      </div>
                    </div>

                    {lead.service_description && (
                      <p className="text-slate-700 text-sm line-clamp-2 mb-3">
                        {lead.service_description}
                      </p>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleCallLead(lead)}
                      >
                        <PhoneCall className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTextLead(lead)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Text
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmailLead(lead)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleCreateEstimate(lead)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Create Estimate
                      </Button>
                    </div>
                  </div>

                  {/* Value & Priority */}
                  <div className="text-right">
                    {lead.estimated_value && lead.estimated_value > 0 && (
                      <div className="mb-2">
                        <div className="text-2xl font-bold text-emerald-600">
                          ${lead.estimated_value.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">Est. Value</div>
                      </div>
                    )}
                    <Badge
                      className={
                        lead.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : lead.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : lead.priority === 'medium'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {lead.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
