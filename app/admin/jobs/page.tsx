'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

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

  // Bulk operations states
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadJobs();
    loadClients();
  }, [
    statusFilter,
    searchQuery,
    dateRange,
    amountRange,
    selectedStatuses,
    selectedClients,
  ]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Basic filters
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      // Advanced filters
      if (dateRange.from)
        params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
      if (dateRange.to)
        params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
      if (amountRange.min !== undefined)
        params.set('minAmount', amountRange.min.toString());
      if (amountRange.max !== undefined)
        params.set('maxAmount', amountRange.max.toString());
      if (selectedStatuses.length > 0)
        params.set('statuses', selectedStatuses.join(','));
      if (selectedClients.length > 0)
        params.set('clients', selectedClients.join(','));

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to load clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  // Bulk operations functions
  const handleSelectJob = (jobId: string, selected: boolean) => {
    if (selected) {
      setSelectedJobs((prev) => [...prev, jobId]);
    } else {
      setSelectedJobs((prev) => prev.filter((id) => id !== jobId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedJobs(jobs.map((job) => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleBulkStatusChange = async (newStatus: JobStatus) => {
    if (selectedJobs.length === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = selectedJobs.map((jobId) =>
        fetch(`/api/jobs/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${selectedJobs.length} jobs to ${newStatus}`,
      });

      setSelectedJobs([]);
      loadJobs();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job statuses',
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

    setBulkActionLoading(true);
    try {
      const promises = selectedJobs.map((jobId) =>
        fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
      );

      await Promise.all(promises);

      toast({
        title: 'Bulk Delete Complete',
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

  const getStatusColor = (status: JobStatus) => {
    const colors: Record<JobStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      quote: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      invoiced: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Wrench className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Kanban helper functions
  const getKanbanColumns = () => {
    const filteredJobs = jobs.filter((job) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      const clientName = job.client
        ? `${job.client.first_name} ${job.client.last_name}`.toLowerCase()
        : '';
      return (
        job.job_number.toLowerCase().includes(searchLower) ||
        job.title.toLowerCase().includes(searchLower) ||
        clientName.includes(searchLower)
      );
    });

    return [
      {
        id: 'draft',
        title: 'Draft',
        items: filteredJobs.filter((job) => job.status === 'draft'),
        color: 'border-slate-400',
      },
      {
        id: 'quote',
        title: 'Quote',
        items: filteredJobs.filter((job) => job.status === 'quote'),
        color: 'border-blue-400',
      },
      {
        id: 'scheduled',
        title: 'Scheduled',
        items: filteredJobs.filter((job) => job.status === 'scheduled'),
        color: 'border-yellow-400',
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        items: filteredJobs.filter((job) => job.status === 'in_progress'),
        color: 'border-orange-400',
      },
      {
        id: 'completed',
        title: 'Completed',
        items: filteredJobs.filter((job) => job.status === 'completed'),
        color: 'border-green-400',
      },
      {
        id: 'invoiced',
        title: 'Invoiced',
        items: filteredJobs.filter((job) => job.status === 'invoiced'),
        color: 'border-purple-400',
      },
      {
        id: 'cancelled',
        title: 'Cancelled',
        items: filteredJobs.filter((job) => job.status === 'cancelled'),
        color: 'border-red-400',
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

  const renderKanbanCard = (job: JobWithClient) => {
    const clientName = job.client
      ? `${job.client.first_name} ${job.client.last_name}`
      : 'No Client';

    return (
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
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

          {job.scheduled_for && (
            <div className="text-xs text-slate-500">
              Scheduled {formatDate(job.scheduled_for)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - Monday.com style */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track field operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => exportJobsToCSV(jobs)}
              variant="outline"
              disabled={jobs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
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
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>
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

        {/* Advanced Filters */}
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
          onStatusChange={setSelectedStatuses}
          clientOptions={clients.map((client) => ({
            id: client.id,
            label: `${client.first_name} ${client.last_name}`,
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

        {/* Jobs Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'all' || searchQuery
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first job.'}
              </p>
              <Button onClick={() => router.push('/jobs/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          <div className="h-[calc(100vh-300px)]">
            <KanbanBoard
              columns={getKanbanColumns()}
              onItemMove={handleStatusChange}
              renderCard={renderKanbanCard}
              loading={loading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border">
              <Checkbox
                checked={selectedJobs.length === jobs.length && jobs.length > 0}
                onCheckedChange={(checked) =>
                  handleSelectAll(checked as boolean)
                }
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedJobs.length === 0
                  ? `Select all ${jobs.length} jobs`
                  : `${selectedJobs.length} of ${jobs.length} selected`}
              </span>
            </div>

            {jobs.map((job) => (
              <Card
                key={job.id}
                className={`hover:shadow-md transition-shadow ${selectedJobs.includes(job.id) ? 'ring-2 ring-primary' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedJobs.includes(job.id)}
                        onCheckedChange={(checked) =>
                          handleSelectJob(job.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {job.job_number}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.title}
                        </p>
                      </div>
                      <Badge
                        className={`inline-flex items-center gap-1.5 px-3 py-1 ${getStatusColor(job.status)}`}
                      >
                        {getStatusIcon(job.status)}
                        {job.status
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {job.client?.first_name} {job.client?.last_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.scheduled_for)}</span>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">${job.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
