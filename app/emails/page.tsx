'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Users,
  DollarSign,
  RefreshCw,
  Brain,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpDown,
  Filter,
  Bell,
  Zap,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Archive,
  MoreHorizontal,
  PenSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  EmailRaw,
  EmailInsight,
  EmailCategory,
  IntelligenceAlert,
  GmailConnection,
} from '@/types/database';
import { supabase } from '@/lib/supabase';
import EmailComposeModal from './components/EmailComposeModal';

interface EmailWithInsight {
  raw: EmailRaw;
  insight?: EmailInsight;
}

export default function EmailIntelligencePage() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailWithInsight[]>([]);
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [gmailConnection, setGmailConnection] =
    useState<GmailConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithInsight | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'received_at' | 'priority' | 'category' | 'from_address'
  >('received_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<EmailCategory | 'all'>(
    'all'
  );
  const [filterPriority, setFilterPriority] = useState<
    'all' | 'urgent' | 'high' | 'medium' | 'low'
  >('all');
  const [activeTab, setActiveTab] = useState('emails');
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeReplyData, setComposeReplyData] = useState<{
    type: 'reply' | 'reply-all' | 'forward';
    originalEmail: EmailWithInsight['raw'];
  } | null>(null);

  useEffect(() => {
    loadEmails();
    loadAlerts();
    loadGmailConnection();
  }, []);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'connected') {
      toast({
        title: 'Gmail Connected!',
        description: 'Your Gmail account has been successfully connected.',
      });
      window.history.replaceState({}, '', window.location.pathname);
      loadEmails();
    } else if (error) {
      let errorMessage = 'Failed to connect Gmail account.';
      switch (error) {
        case 'oauth_failed':
          errorMessage = 'Google OAuth authorization failed.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received from Google.';
          break;
        case 'token_exchange_failed':
          errorMessage =
            'Failed to exchange authorization code for access token.';
          break;
      }
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const connectGmail = () => {
    window.location.href = '/api/auth/google';
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Sync Complete',
          description: `Processed ${result.processed} emails from Gmail.`,
        });
        await loadEmails();
        await loadAlerts();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync emails:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync emails from Gmail.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const reprocessAllEmails = async (force = false) => {
    setReprocessing(true);
    try {
      const response = await fetch('/api/email-intelligence/reprocess-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });

      if (response.ok) {
        const result = await response.json();
        const skippedCount =
          result.summary.total -
          result.summary.processed -
          result.summary.failed;
        toast({
          title: 'Processing Complete',
          description: force
            ? `Reprocessed all ${result.summary.processed} emails, ${result.summary.alerts_generated} alerts generated`
            : `Processed ${result.summary.processed} new emails (${skippedCount} already analyzed), ${result.summary.alerts_generated} alerts generated`,
        });
        loadEmails();
        loadAlerts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to process emails',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process emails',
        variant: 'destructive',
      });
    } finally {
      setReprocessing(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);

      const { data: emailsData, error } = await supabase
        .from('emails_raw')
        .select(
          `
          *,
          email_insights (*)
        `
        )
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading emails:', error);
        toast({
          title: 'Error',
          description: 'Failed to load emails',
          variant: 'destructive',
        });
        return;
      }

      const emailsWithInsights: EmailWithInsight[] = (emailsData || []).map(
        (email) => ({
          raw: email,
          insight: email.email_insights?.[0],
        })
      );

      setEmails(emailsWithInsights);
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to load emails',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadGmailConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_connections')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        console.error('Error loading Gmail connection:', error);
        return;
      }

      setGmailConnection(data);
    } catch (error) {
      console.error('Failed to load Gmail connection:', error);
    }
  };

  const getCategoryColor = (category?: EmailCategory) => {
    if (!category) return 'bg-gray-100 text-gray-800';

    switch (category) {
      case 'LEAD_NEW':
      case 'LEAD_FOLLOWUP':
        return 'bg-green-100 text-green-800';
      case 'BILLING_INCOMING_INVOICE':
      case 'BILLING_OUTGOING_INVOICE':
      case 'BILLING_PAYMENT_RECEIVED':
      case 'BILLING_PAYMENT_ISSUE':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULING_REQUEST':
      case 'SCHEDULING_CHANGE':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOMER_SUPPORT':
        return 'bg-orange-100 text-orange-800';
      case 'VENDOR_RECEIPT':
        return 'bg-yellow-100 text-yellow-800';
      case 'SYSTEM_SECURITY':
        return 'bg-red-100 text-red-800';
      case 'NEWSLETTER_PROMO':
        return 'bg-indigo-100 text-indigo-800';
      case 'SPAM_OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 text-red-700 bg-red-50';
      case 'high':
        return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'low':
        return 'border-gray-500 text-gray-700 bg-gray-50';
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  const filteredAndSortedEmails = emails
    .filter((email) => {
      const matchesSearch =
        !searchTerm ||
        email.raw.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.raw.from_address
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        email.raw.body_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.insight?.summary
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === 'all' || email.insight?.category === filterCategory;
      const matchesPriority =
        filterPriority === 'all' || email.insight?.priority === filterPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'received_at':
          aValue = new Date(a.raw.received_at || 0).getTime();
          bValue = new Date(b.raw.received_at || 0).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue =
            priorityOrder[a.insight?.priority as keyof typeof priorityOrder] ||
            0;
          bValue =
            priorityOrder[b.insight?.priority as keyof typeof priorityOrder] ||
            0;
          break;
        case 'category':
          aValue = a.insight?.category || '';
          bValue = b.insight?.category || '';
          break;
        case 'from_address':
          aValue = a.raw.from_address || '';
          bValue = b.raw.from_address || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const markAlertAsResolved = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast({
        title: 'Alert Resolved',
        description: 'Alert has been marked as resolved.',
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert.',
        variant: 'destructive',
      });
    }
  };

  const handleComposeNew = () => {
    setComposeReplyData(null);
    setComposeModalOpen(true);
  };

  const handleReply = (email: EmailWithInsight) => {
    setComposeReplyData({
      type: 'reply',
      originalEmail: email.raw,
    });
    setComposeModalOpen(true);
  };

  const handleReplyAll = (email: EmailWithInsight) => {
    setComposeReplyData({
      type: 'reply-all',
      originalEmail: email.raw,
    });
    setComposeModalOpen(true);
  };

  const handleForward = (email: EmailWithInsight) => {
    setComposeReplyData({
      type: 'forward',
      originalEmail: email.raw,
    });
    setComposeModalOpen(true);
  };

  const handleDelete = async (emailId: string) => {
    try {
      const response = await fetch('/api/gmail/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          messageId: emailId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Email Deleted',
          description: 'Email has been moved to trash.',
        });
        // Remove from local state
        setEmails((prev) => prev.filter((email) => email.raw.id !== emailId));
        if (selectedEmail?.raw.id === emailId) {
          setSelectedEmail(null);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete email.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      if (gmailConnection) {
        const { error } = await supabase
          .from('gmail_connections')
          .update({ is_active: false })
          .eq('id', gmailConnection.id);

        if (error) throw error;

        setGmailConnection(null);
        toast({
          title: 'Gmail Disconnected',
          description: 'Gmail connection has been removed.',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Gmail.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (emailId: string) => {
    try {
      const response = await fetch('/api/gmail/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          messageId: emailId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Email Archived',
          description: 'Email has been archived.',
        });
        // Remove from local state
        setEmails((prev) => prev.filter((email) => email.raw.id !== emailId));
        if (selectedEmail?.raw.id === emailId) {
          setSelectedEmail(null);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive email');
      }
    } catch (error) {
      console.error('Failed to archive email:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to archive email.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Email Intelligence</h1>
          <p className="text-sm text-gray-600">AI-powered email analysis</p>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {gmailConnection ? (
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Connected to {gmailConnection.email_address}
                  </span>
                </div>
                <Button
                  onClick={() => handleDisconnectGmail()}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-800"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={connectGmail} className="w-full" variant="outline">
              Connect Gmail
            </Button>
          )}
          <Button
            onClick={handleComposeNew}
            className="w-full"
            variant="default"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Compose New
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={syncEmails}
              disabled={syncing}
              size="sm"
              variant="ghost"
              title="Sync new emails from Gmail"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
              />
              Sync
            </Button>
            <Button
              onClick={() => reprocessAllEmails(false)}
              disabled={reprocessing}
              size="sm"
              variant="ghost"
              title="Process new unreviewed emails only"
            >
              <Brain
                className={`w-4 h-4 ${reprocessing ? 'animate-spin' : ''}`}
              />
              Process New
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium mb-3">Dashboard Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Total Emails</span>
              </div>
              <span className="font-medium">{emails.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span className="text-sm">AI Analyzed</span>
              </div>
              <span className="font-medium text-blue-600">
                {emails.filter((e) => e.insight).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">High Priority</span>
              </div>
              <span className="font-medium text-red-600">
                {
                  emails.filter(
                    (e) =>
                      e.insight?.priority === 'urgent' ||
                      e.insight?.priority === 'high'
                  ).length
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Open Alerts</span>
              </div>
              <span className="font-medium text-orange-600">
                {alerts.length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="p-4 flex-1">
          <h3 className="font-medium mb-3">Quick Filters</h3>
          <div className="space-y-2">
            <Button
              variant={filterPriority === 'urgent' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() =>
                setFilterPriority(
                  filterPriority === 'urgent' ? 'all' : 'urgent'
                )
              }
            >
              <Zap className="w-4 h-4 mr-2" />
              Urgent Only
            </Button>
            <Button
              variant={filterCategory === 'LEAD_NEW' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() =>
                setFilterCategory(
                  filterCategory === 'LEAD_NEW' ? 'all' : 'LEAD_NEW'
                )
              }
            >
              <Users className="w-4 h-4 mr-2" />
              New Leads
            </Button>
            <Button
              variant={
                filterCategory === 'BILLING_INCOMING_INVOICE'
                  ? 'default'
                  : 'ghost'
              }
              size="sm"
              className="w-full justify-start"
              onClick={() =>
                setFilterCategory(
                  filterCategory === 'BILLING_INCOMING_INVOICE'
                    ? 'all'
                    : 'BILLING_INCOMING_INVOICE'
                )
              }
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Invoices
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails ({filteredAndSortedEmails.length})
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alerts ({alerts.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="emails" className="flex-1 flex flex-col m-0">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received_at">Date Received</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="from_address">Sender</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>

                <Select
                  value={filterCategory}
                  onValueChange={(value: any) => setFilterCategory(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="LEAD_NEW">New Leads</SelectItem>
                    <SelectItem value="BILLING_INCOMING_INVOICE">
                      Invoices
                    </SelectItem>
                    <SelectItem value="CUSTOMER_SUPPORT">Support</SelectItem>
                    <SelectItem value="SCHEDULING_REQUEST">
                      Scheduling
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedEmails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No emails found</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search terms</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedEmails.map((email) => (
                    <div
                      key={email.raw.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedEmail?.raw.id === email.raw.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      } ${email.insight?.priority === 'urgent' ? 'bg-red-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {email.raw.from_address || 'Unknown sender'}
                            </span>
                            {email.insight?.category && (
                              <Badge
                                className={getCategoryColor(
                                  email.insight.category
                                )}
                                variant="secondary"
                              >
                                {email.insight.category.replace('_', ' ')}
                              </Badge>
                            )}
                            {email.insight?.priority &&
                              email.insight.priority !== 'low' && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(email.insight.priority)}`}
                                >
                                  {email.insight.priority}
                                </Badge>
                              )}
                            {email.insight && (
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full"
                                title="AI Analyzed"
                              ></div>
                            )}
                          </div>
                          <div className="text-sm truncate mb-1 font-medium">
                            {email.raw.subject || 'No subject'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {email.insight?.summary ||
                              email.raw.snippet ||
                              email.raw.body_text?.substring(0, 100) + '...'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {email.raw.received_at
                            ? new Date(
                                email.raw.received_at
                              ).toLocaleDateString()
                            : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="flex-1 flex flex-col m-0">
            <div className="flex-1 overflow-y-auto p-4">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p className="text-lg font-medium">All Clear!</p>
                    <p className="text-sm">No open alerts at this time.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className="border-l-4 border-orange-500"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <AlertDescription className="font-medium">
                              {alert.title}
                            </AlertDescription>
                            <p className="text-sm text-gray-600 mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAlertAsResolved(alert.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Email Detail View - Improved */}
        {selectedEmail && (
          <div
            className="border-t border-gray-200 bg-white flex flex-col"
            style={{ maxHeight: '50vh' }}
          >
            {/* Header with Actions */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedEmail.raw.subject || 'No subject'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {selectedEmail.raw.from_address || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {selectedEmail.raw.received_at
                          ? new Date(
                              selectedEmail.raw.received_at
                            ).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                  {selectedEmail.raw.to_addresses && (
                    <p className="text-xs text-gray-500 mt-1">
                      To: {selectedEmail.raw.to_addresses}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                  className="flex-shrink-0"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleReply(selectedEmail)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReplyAll(selectedEmail)}
                >
                  <ReplyAll className="w-4 h-4 mr-2" />
                  Reply All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleForward(selectedEmail)}
                >
                  <Forward className="w-4 h-4 mr-2" />
                  Forward
                </Button>
                <div className="flex-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchive(selectedEmail.raw.id)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedEmail.raw.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* AI Analysis Section */}
            {selectedEmail.insight && (
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-purple-900">
                        AI Analysis
                      </span>
                      <Badge
                        className={getCategoryColor(
                          selectedEmail.insight.category
                        )}
                        variant="secondary"
                      >
                        {selectedEmail.insight.category?.replace('_', ' ') ||
                          'Unknown'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(
                          selectedEmail.insight.priority
                        )}
                      >
                        {selectedEmail.insight.priority || 'low'}
                      </Badge>
                    </div>

                    {selectedEmail.insight.summary && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium text-gray-900">
                          Summary:
                        </span>{' '}
                        {selectedEmail.insight.summary}
                      </p>
                    )}

                    {selectedEmail.insight.is_action_required && (
                      <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            Action Required:{' '}
                            {selectedEmail.insight.action_type ||
                              'Review needed'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {selectedEmail.raw.body_html ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedEmail.raw.body_html,
                  }}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {selectedEmail.raw.body_text || 'No content available'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Compose Modal */}
        <EmailComposeModal
          isOpen={composeModalOpen}
          onClose={() => {
            setComposeModalOpen(false);
            setComposeReplyData(null);
          }}
          replyData={composeReplyData || undefined}
        />
      </div>
    </div>
  );
}
