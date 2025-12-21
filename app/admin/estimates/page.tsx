'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EstimateWithRelations, EstimateStats } from '@/types/estimate';
import {
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { exportEstimatesToCSV } from '@/lib/csv-export';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';

// Lazy load KanbanBoard component
const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
}) as any;

// Lazy load AI Estimate Generator
const AIEstimateGenerator = dynamic(
  () => import('@/components/ai-estimate-generator'),
  {
    loading: () => (
      <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed">
        Loading AI Generator...
      </div>
    ),
  }
);

export default function EstimatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateWithRelations[]>([]);
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedEstimate, setSelectedEstimate] =
    useState<EstimateWithRelations | null>(null);
  const [estimateDetailsExpanded, setEstimateDetailsExpanded] = useState(true);

  // Advanced filter states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [amountRange, setAmountRange] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({
    min: undefined,
    max: undefined,
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadEstimates();
    loadClients();
    loadLeads();
  }, [searchQuery, dateRange, amountRange, selectedStatuses, selectedClients]);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateRange.from) params.set('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.set('dateTo', dateRange.to.toISOString());
      if (amountRange.min !== undefined)
        params.set('amountMin', amountRange.min.toString());
      if (amountRange.max !== undefined)
        params.set('amountMax', amountRange.max.toString());
      if (selectedStatuses.length > 0)
        params.set('statuses', selectedStatuses.join(','));
      if (selectedClients.length > 0)
        params.set('clients', selectedClients.join(','));

      const response = await fetch(`/api/estimates?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load estimates');
      }

      const data = await response.json();
      console.log(
        'Loaded estimates:',
        data.estimates?.length || 0,
        'estimates'
      );
      if (data.estimates?.length > 0) {
        console.log(
          'Sample estimate IDs:',
          data.estimates.slice(0, 3).map((e: any) => e.id)
        );
      }
      setEstimates(data.estimates || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to load estimates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load estimates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/admin/clients?limit=100');
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=100');
      if (response.ok) {
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    }
  };

  const getKanbanColumns = () => {
    return [
      {
        id: 'draft',
        title: 'Draft',
        items: estimates.filter((estimate) => estimate.status === 'draft'),
        color: 'border-gray-400',
      },
      {
        id: 'sent',
        title: 'Sent',
        items: estimates.filter((estimate) => estimate.status === 'sent'),
        color: 'border-blue-400',
      },
      {
        id: 'approved',
        title: 'Approved',
        items: estimates.filter((estimate) => estimate.status === 'approved'),
        color: 'border-green-400',
      },
      {
        id: 'declined',
        title: 'Declined',
        items: estimates.filter((estimate) => estimate.status === 'declined'),
        color: 'border-red-400',
      },
    ];
  };

  const handleStatusChange = async (estimateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update estimate status');
      }

      toast({
        title: 'Status Updated',
        description: `Estimate moved to ${newStatus}`,
      });

      loadEstimates();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update estimate status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstimateWorkflowStatus = (estimate: EstimateWithRelations) => {
    if (estimate.status === 'sent') {
      // Check if follow-up is needed (7 days after sent)
      if (estimate.sent_date) {
        const sentDate = new Date(estimate.sent_date);
        const now = new Date();
        const daysSinceSent = Math.floor(
          (now.getTime() - sentDate.getTime()) / (1000 * 3600 * 24)
        );

        if (daysSinceSent >= 7) {
          return 'followup_pending';
        }
      }
      return 'sent_no_followup';
    }
    return estimate.status;
  };

  const renderKanbanCard = (estimate: EstimateWithRelations) => {
    const workflowStatus = getEstimateWorkflowStatus(estimate);
    const clientName = estimate.client
      ? `${estimate.client.first_name} ${estimate.client.last_name}`
      : estimate.lead
        ? `${estimate.lead.first_name} ${estimate.lead.last_name}`
        : 'No Client';
    const isSelected = selectedEstimate?.id === estimate.id;

    return (
      <div
        className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer transform hover:scale-[1.02] ${
          isSelected
            ? 'ring-2 ring-primary border-primary shadow-lg'
            : 'border-slate-200'
        }`}
        onClick={() => setSelectedEstimate(estimate)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm truncate">
              #{estimate.estimate_number}
            </h4>
            <p className="text-slate-600 text-sm truncate mt-1">
              {estimate.title}
            </p>
          </div>
          <Badge className={`text-xs ml-2 ${getStatusColor(workflowStatus)}`}>
            {workflowStatus === 'followup_pending'
              ? 'Follow-up'
              : workflowStatus === 'sent_no_followup'
                ? 'Sent'
                : estimate.status.charAt(0).toUpperCase() +
                  estimate.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 truncate">{clientName}</span>
            <span className="font-semibold text-emerald-600">
              ${estimate.total.toLocaleString()}
            </span>
          </div>

          {estimate.sent_date && (
            <div className="text-xs text-slate-500">
              📅 Sent {format(new Date(estimate.sent_date), 'MMM d')}
            </div>
          )}

          {estimate.valid_until && (
            <div className="text-xs text-slate-500">
              ⏰ Expires {format(new Date(estimate.valid_until), 'MMM d')}
            </div>
          )}

          {/* Quick indicators */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {estimate.line_items && estimate.line_items.length > 0 && (
              <span>📋</span>
            )}
            {estimate.notes && <span>📝</span>}
          </div>
        </div>
      </div>
    );
  };

  const handleSendEstimate = async (estimateId: string) => {
    // Implementation would go here - for now just show a placeholder
    toast({
      title: 'Send Estimate',
      description: 'Send estimate functionality would be implemented here',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Estimates</h1>
              <p className="text-muted-foreground text-sm">
                Create and manage quotes and proposals for your clients
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportEstimatesToCSV(estimates)}
                variant="outline"
                size="sm"
                disabled={estimates.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1"
                >
                  List
                </Button>
                <Button
                  onClick={() => setViewMode('kanban')}
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1"
                >
                  Kanban
                </Button>
              </div>
              <AIEstimateGenerator onEstimateCreated={loadEstimates} />
              <Button
                onClick={() => router.push('/estimates/new')}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Estimate
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filters - Compact */}
        <div className="py-4">
          {/* TODO: Add AdvancedFilters component */}
          <div className="text-sm text-muted-foreground">
            Filters coming soon...
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Kanban Board - Full Width */}
          {viewMode === 'kanban' && (
            <div className="flex-1 mb-4">
              <KanbanBoard
                columns={getKanbanColumns()}
                onItemMove={handleStatusChange}
                renderCard={renderKanbanCard}
                loading={loading}
              />
            </div>
          )}

          {/* Estimate Details Panel */}
          {selectedEstimate && estimateDetailsExpanded && (
            <div className="bg-white rounded-lg border border-border shadow-sm">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Estimate #{selectedEstimate.estimate_number}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log(
                          'Navigating to estimate summary:',
                          selectedEstimate.id,
                          selectedEstimate.estimate_number
                        );
                        router.push(
                          `/admin/estimates/${selectedEstimate.id}/summary`
                        );
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Full Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEstimateDetailsExpanded(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Estimate Info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Estimate Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Title:</strong> {selectedEstimate.title}
                        </div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <Badge
                            className={getStatusColor(
                              getEstimateWorkflowStatus(selectedEstimate)
                            )}
                          >
                            {getEstimateWorkflowStatus(selectedEstimate) ===
                            'followup_pending'
                              ? 'Follow-up Pending'
                              : getEstimateWorkflowStatus(selectedEstimate) ===
                                  'sent_no_followup'
                                ? 'Sent'
                                : selectedEstimate.status
                                    .charAt(0)
                                    .toUpperCase() +
                                  selectedEstimate.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <strong>Total:</strong> $
                          {selectedEstimate.total?.toLocaleString() || '0'}
                        </div>
                        {selectedEstimate.sent_date && (
                          <div>
                            <strong>Sent:</strong>{' '}
                            {format(
                              new Date(selectedEstimate.sent_date),
                              'MMM d, yyyy'
                            )}
                          </div>
                        )}
                        {selectedEstimate.valid_until && (
                          <div>
                            <strong>Expires:</strong>{' '}
                            {format(
                              new Date(selectedEstimate.valid_until),
                              'MMM d, yyyy'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Client/Lead Info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Client Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedEstimate.client ? (
                          <>
                            <div>
                              <strong>Name:</strong>{' '}
                              {selectedEstimate.client.first_name}{' '}
                              {selectedEstimate.client.last_name}
                            </div>
                            <div>
                              <strong>Phone:</strong>{' '}
                              {selectedEstimate.client.phone || 'N/A'}
                            </div>
                            <div>
                              <strong>Email:</strong>{' '}
                              {selectedEstimate.client.email || 'N/A'}
                            </div>
                          </>
                        ) : selectedEstimate.lead ? (
                          <>
                            <div>
                              <strong>Name:</strong>{' '}
                              {selectedEstimate.lead.first_name}{' '}
                              {selectedEstimate.lead.last_name}
                            </div>
                            <div>
                              <strong>Phone:</strong>{' '}
                              {selectedEstimate.lead.phone || 'N/A'}
                            </div>
                            <div>
                              <strong>Email:</strong>{' '}
                              {selectedEstimate.lead.email || 'N/A'}
                            </div>
                          </>
                        ) : (
                          <div>No client assigned</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Quick Actions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEstimate.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSendEstimate(selectedEstimate.id)
                            }
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Estimate
                          </Button>
                        )}
                        {selectedEstimate.status === 'approved' &&
                          selectedEstimate.converted_to_job_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/jobs/${selectedEstimate.converted_to_job_id}`
                                )
                              }
                            >
                              Go to Job
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/api/estimates/${selectedEstimate.id}/pdf`,
                              '_blank'
                            )
                          }
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Download PDF
                        </Button>
                        <Button size="sm" variant="outline">
                          📝 Add Notes
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimate Description */}
                {selectedEstimate.description && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEstimate.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="flex-1 bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-y-auto h-full">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      Loading estimates...
                    </p>
                  </div>
                ) : estimates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No estimates found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first estimate.
                    </p>
                    <Button onClick={() => router.push('/estimates/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Estimate
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {estimates.map((estimate) => {
                      const workflowStatus =
                        getEstimateWorkflowStatus(estimate);
                      const clientName = estimate.client
                        ? `${estimate.client.first_name} ${estimate.client.last_name}`
                        : estimate.lead
                          ? `${estimate.lead.first_name} ${estimate.lead.last_name}`
                          : 'No Client';

                      return (
                        <div
                          key={estimate.id}
                          className={`p-6 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedEstimate?.id === estimate.id
                              ? 'bg-primary/5 border-l-4 border-l-primary'
                              : ''
                          }`}
                          onClick={() => {
                            console.log(
                              'Selected estimate:',
                              estimate.id,
                              estimate.estimate_number
                            );
                            setSelectedEstimate(estimate);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                  #{estimate.estimate_number}
                                </h3>
                                <Badge
                                  className={getStatusColor(workflowStatus)}
                                >
                                  {workflowStatus === 'followup_pending'
                                    ? 'Follow-up Pending'
                                    : workflowStatus === 'sent_no_followup'
                                      ? 'Sent'
                                      : estimate.status
                                          .charAt(0)
                                          .toUpperCase() +
                                        estimate.status.slice(1)}
                                </Badge>
                                {workflowStatus === 'followup_pending' && (
                                  <Badge
                                    variant="outline"
                                    className="text-orange-600 border-orange-300"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    7+ days
                                  </Badge>
                                )}
                              </div>

                              <p className="text-muted-foreground mb-3">
                                {estimate.title}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-foreground">
                                    Client:
                                  </span>
                                  <span className="ml-2 text-muted-foreground">
                                    {clientName}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-medium text-foreground">
                                    Total:
                                  </span>
                                  <span className="ml-2 font-semibold text-emerald-600">
                                    ${estimate.total?.toLocaleString() || '0'}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-medium text-foreground">
                                    Created:
                                  </span>
                                  <span className="ml-2 text-muted-foreground">
                                    {format(
                                      new Date(estimate.created_at),
                                      'MMM d, yyyy'
                                    )}
                                  </span>
                                </div>

                                {estimate.sent_date && (
                                  <div>
                                    <span className="font-medium text-foreground">
                                      Sent:
                                    </span>
                                    <span className="ml-2 text-muted-foreground">
                                      {format(
                                        new Date(estimate.sent_date),
                                        'MMM d, yyyy'
                                      )}
                                    </span>
                                  </div>
                                )}

                                {estimate.valid_until && (
                                  <div>
                                    <span className="font-medium text-foreground">
                                      Expires:
                                    </span>
                                    <span className="ml-2 text-muted-foreground">
                                      {format(
                                        new Date(estimate.valid_until),
                                        'MMM d, yyyy'
                                      )}
                                    </span>
                                  </div>
                                )}

                                {estimate.converted_to_job_id && (
                                  <div className="md:col-span-3">
                                    <Badge
                                      variant="outline"
                                      className="text-green-600 border-green-300"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Converted to Job
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `/api/estimates/${estimate.id}/pdf`,
                                    '_blank'
                                  );
                                }}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/admin/estimates/${estimate.id}/summary`
                                  );
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>

                              {estimate.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEstimate(estimate.id);
                                  }}
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Send
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
