'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobWithClient, JobStatus } from '@/types/job';
import {
  Search,
  Plus,
  Calendar,
  User,
  FileText,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  X,
} from 'lucide-react';
import { exportJobsToCSV } from '@/lib/csv-export';
import { useToast } from '@/components/ui/toast';
import AdvancedFilters from '@/components/ui/advanced-filters';

// Lazy load KanbanBoard component
const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
}) as any;

export default function JobsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to kanban
  const [selectedJob, setSelectedJob] = useState<JobWithClient | null>(null);
  const [jobDetailsExpanded, setJobDetailsExpanded] = useState(true);

  // Advanced filter states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [amountRange, setAmountRange] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({ min: undefined, max: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState<JobStatus[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Bulk actions
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const statusTabs = [
    { value: 'all', label: 'All Jobs' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    loadJobs();
    loadClients();
  }, [
    searchQuery,
    statusFilter,
    dateRange,
    amountRange,
    selectedStatuses,
    selectedClients,
  ]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
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

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
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

  const getKanbanColumns = () => {
    return [
      {
        id: 'scheduled',
        title: 'Scheduled',
        items: jobs.filter((job) => job.status === 'scheduled'),
        color: 'border-blue-400',
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        items: jobs.filter((job) => job.status === 'in_progress'),
        color: 'border-orange-400',
      },
      {
        id: 'completed',
        title: 'Completed',
        items: jobs.filter((job) => job.status === 'completed'),
        color: 'border-green-400',
      },
      {
        id: 'invoiced',
        title: 'Invoiced',
        items: jobs.filter((job) => job.status === 'invoiced'),
        color: 'border-purple-400',
      },
    ];
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      toast({
        title: 'Status Updated',
        description: `Job moved to ${newStatus}`,
      });

      loadJobs();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
      throw error; // Re-throw to let KanbanBoard handle the error
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'invoiced':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderKanbanCard = (job: JobWithClient) => {
    const clientName = job.client ? job.client.name || 'No Name' : 'No Client';
    const isSelected = selectedJob?.id === job.id;

    return (
      <div
        className={`bg-card rounded-lg border p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer transform hover:scale-[1.02] ${
          isSelected
            ? 'ring-2 ring-primary border-primary shadow-lg'
            : 'border-border'
        }`}
        onClick={() => setSelectedJob(job)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm truncate">
              #{job.job_number}
            </h4>
            <p className="text-slate-600 text-sm truncate mt-1">{job.title}</p>
          </div>
          <Badge className={`text-xs ml-2 ${getStatusColor(job.status)}`}>
            {job.status
              .replace('_', ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 truncate">{clientName}</span>
            <span className="font-semibold text-emerald-600">
              ${job.total.toLocaleString()}
            </span>
          </div>

          {job.service_date && (
            <div className="text-xs text-slate-500">
              📅 {formatDate(job.service_date)}
            </div>
          )}

          {/* Quick indicators */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {job.notes && <span>📝</span>}
            {/* Add more indicators as needed */}
          </div>
        </div>
      </div>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(jobs.map((job) => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    if (checked) {
      setSelectedJobs((prev) => [...prev, jobId]);
    } else {
      setSelectedJobs((prev) => prev.filter((id) => id !== jobId));
    }
  };

  const handleBulkStatusChange = async (status: JobStatus) => {
    if (selectedJobs.length === 0) return;

    try {
      setBulkActionLoading(true);
      const promises = selectedJobs.map((jobId) =>
        fetch(`/api/jobs/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Updated ${selectedJobs.length} jobs to ${status}`,
      });

      setSelectedJobs([]);
      loadJobs();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update jobs',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = () => {
    const selectedJobData = jobs.filter((job) => selectedJobs.includes(job.id));
    exportJobsToCSV(selectedJobData);
    setSelectedJobs([]);
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedJobs.length} jobs? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const promises = selectedJobs.map((jobId) =>
        fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Deleted ${selectedJobs.length} jobs`,
      });

      setSelectedJobs([]);
      loadJobs();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete jobs',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
              <p className="text-muted-foreground text-sm">
                Manage and track field operations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportJobsToCSV(jobs)}
                variant="outline"
                size="sm"
                disabled={jobs.length === 0}
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
              <Button
                onClick={() => router.push('/jobs/new')}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filters - Compact */}
        <div className="py-4">
          <AdvancedFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            amountRange={amountRange}
            onAmountRangeChange={setAmountRange}
            statusOptions={statusTabs.map((tab) => ({
              id: tab.value,
              label: tab.label,
              value: tab.value,
            }))}
            selectedStatuses={selectedStatuses}
            onStatusChange={(statuses: string[]) =>
              setSelectedStatuses(statuses as JobStatus[])
            }
            clientOptions={clients.map((client) => ({
              id: client.id,
              label:
                (client as any).name ||
                `${client.first_name} ${client.last_name}`,
              value: client.id,
            }))}
            selectedClients={selectedClients}
            onClientChange={setSelectedClients}
            quickFilters={[
              {
                id: 'today',
                label: 'Today',
                icon: <Calendar className="w-4 h-4" />,
                onClick: () => {
                  const today = new Date();
                  setDateRange({ from: today, to: today });
                },
              },
              {
                id: 'this-week',
                label: 'This Week',
                icon: <Calendar className="w-4 h-4" />,
                onClick: () => {
                  const today = new Date();
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - today.getDay());
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  setDateRange({ from: weekStart, to: weekEnd });
                },
              },
              {
                id: 'active',
                label: 'Active Jobs',
                onClick: () => {
                  setSelectedStatuses(['scheduled', 'in_progress']);
                },
              },
            ]}
            onClearAll={() => {
              setDateRange({ from: undefined, to: undefined });
              setAmountRange({ min: undefined, max: undefined });
              setSelectedStatuses([]);
              setSelectedClients([]);
            }}
          />
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedJobs.length > 0 && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-primary">
                    {selectedJobs.length} job
                    {selectedJobs.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedJobs([])}
                    className="text-primary border-primary/30"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Selection
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                    disabled={bulkActionLoading}
                    className="text-primary border-primary/30"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export Selected
                  </Button>

                  <div className="flex gap-1">
                    {(
                      [
                        'scheduled',
                        'in_progress',
                        'completed',
                        'invoiced',
                      ] as JobStatus[]
                    ).map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange(status)}
                        disabled={bulkActionLoading}
                        className="text-primary border-primary/30 capitalize"
                      >
                        Mark {status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col h-[calc(100vh-250px)]">
          {/* Kanban Board - Full Width */}
          {viewMode === 'kanban' && (
            <div className="flex-1">
              <KanbanBoard
                columns={getKanbanColumns()}
                onItemMove={handleStatusChange}
                renderCard={renderKanbanCard}
                loading={loading}
              />
            </div>
          )}

          {/* Job Details Panel */}
          {selectedJob && jobDetailsExpanded && (
            <div className="bg-white rounded-lg border border-border shadow-sm">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Job Details: #{selectedJob.job_number}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/jobs/${selectedJob.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Full Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJobDetailsExpanded(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Job Info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Job Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Title:</strong> {selectedJob.title}
                        </div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <Badge className={getStatusColor(selectedJob.status)}>
                            {selectedJob.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <strong>Total:</strong> $
                          {selectedJob.total.toLocaleString()}
                        </div>
                        {selectedJob.service_date && (
                          <div>
                            <strong>Scheduled:</strong>{' '}
                            {formatDate(selectedJob.service_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Client Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedJob.client ? (
                          <>
                            <div>
                              <strong>Name:</strong>{' '}
                              {(selectedJob.client as any).name ||
                                `${selectedJob.client.first_name} ${selectedJob.client.last_name}`}
                            </div>
                            <div>
                              <strong>Phone:</strong>{' '}
                              {selectedJob.client.phone || 'N/A'}
                            </div>
                            <div>
                              <strong>Email:</strong>{' '}
                              {selectedJob.client.email || 'N/A'}
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
                        <Button size="sm" variant="outline">
                          <User className="w-4 h-4 mr-1" />
                          Assign Tech
                        </Button>
                        <Button size="sm" variant="outline">
                          📷 Add Photos
                        </Button>
                        <Button size="sm" variant="outline">
                          💬 Add Notes
                        </Button>
                        <Button size="sm" variant="outline">
                          ⏱️ Start Timer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                {selectedJob.description && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedJob.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List View (if needed) */}
          {viewMode === 'list' && (
            <div className="flex-1 bg-white rounded-lg border border-border">
              {/* List view implementation would go here */}
              <div className="p-8 text-center text-muted-foreground">
                List view coming soon. Please use Kanban view for now.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
