'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  PageHeader,
  PageContainer,
  ContentSection,
  EmptyState,
  Spinner,
  Button,
  ButtonLoader,
} from '@/components/ui';
import {
  JobFilters,
  JobFiltersState,
  JobTable,
  JobCard,
} from '@/components/jobs';
import type { JobWithClient, JobStatus } from '@/types/job';
import {
  Plus,
  Download,
  LayoutGrid,
  List,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { exportJobsToCSV } from '@/lib/csv-export';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  ),
}) as any;

type ViewMode = 'table' | 'cards' | 'kanban';

export default function JobsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [jobs, setJobs] = React.useState<JobWithClient[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [techs, setTechs] = React.useState<
    Array<{ id: string; full_name?: string; email: string }>
  >([]);

  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    const v = searchParams.get('view') as ViewMode;
    return v === 'cards' || v === 'table' || v === 'kanban' ? v : 'kanban';
  });

  const [filters, setFilters] = React.useState<JobFiltersState>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as JobStatus | 'all') || 'all',
    priority:
      (searchParams.get('priority') as JobFiltersState['priority']) || 'all',
    assignedTech: searchParams.get('tech') || '',
    dateFrom: searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined,
    dateTo: searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined,
  }));

  const [selectedJobs, setSelectedJobs] = React.useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [jobToDelete, setJobToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadJobs();
    loadTechs();
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.priority !== 'all') params.set('priority', filters.priority);
      if (filters.assignedTech)
        params.set('assigned_tech_id', filters.assignedTech);
      if (filters.dateFrom)
        params.set('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      if (filters.dateTo)
        params.set('dateTo', filters.dateTo.toISOString().split('T')[0]);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load jobs');

      const data = await response.json();
      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTechs = async () => {
    try {
      const response = await fetch('/api/admin/users?role=TECH');
      if (response.ok) {
        const data = await response.json();
        setTechs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load techs:', err);
    }
  };

  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setSelectedJobs([]);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status Updated',
        description: `Job moved to ${newStatus.replace('_', ' ')}`,
      });

      loadJobs();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`/api/jobs/${jobToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete job');

      toast({
        title: 'Job Deleted',
        description: 'The job has been removed',
      });

      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete));
      setSelectedJobs((prev) => prev.filter((id) => id !== jobToDelete));
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    } finally {
      setJobToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkStatusChange = async (status: JobStatus) => {
    if (selectedJobs.length === 0) return;

    try {
      setBulkActionLoading(true);
      const promises = selectedJobs.map((id) =>
        fetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Updated ${selectedJobs.length} jobs to ${status.replace('_', ' ')}`,
      });

      setSelectedJobs([]);
      loadJobs();
    } catch (err) {
      console.error('Bulk status update failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to update jobs',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;

    try {
      setBulkActionLoading(true);
      const promises = selectedJobs.map((id) =>
        fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Deleted ${selectedJobs.length} jobs`,
      });

      setSelectedJobs([]);
      loadJobs();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete jobs',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = () => {
    const dataToExport =
      selectedJobs.length > 0
        ? jobs.filter((j) => selectedJobs.includes(j.id))
        : jobs;
    exportJobsToCSV(dataToExport);
    toast({
      title: 'Export Complete',
      description: `Exported ${dataToExport.length} jobs`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedJobs(checked ? jobs.map((j) => j.id) : []);
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    setSelectedJobs((prev) =>
      checked ? [...prev, jobId] : prev.filter((id) => id !== jobId)
    );
  };

  const getKanbanColumns = () => [
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

  const renderKanbanCard = (job: JobWithClient) => {
    const clientName = job.client
      ? (job.client as any).name ||
        `${(job.client as any).first_name || ''} ${(job.client as any).last_name || ''}`.trim()
      : 'No Client';

    return (
      <div
        className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => router.push(`/admin/jobs/${job.id}`)}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="font-semibold text-sm">#{job.job_number}</span>
          <span className="text-xs text-muted-foreground">
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <p className="font-medium text-sm mb-1 truncate">{job.title}</p>
        <p className="text-xs text-muted-foreground truncate mb-2">
          {clientName}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {job.service_date
              ? new Date(job.service_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Not scheduled'}
          </span>
          <span className="font-semibold text-emerald-600">
            ${job.total.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  const filteredCount = jobs.length;

  return (
    <PageContainer maxWidth="xl" padding="md">
      <PageHeader
        title="Jobs"
        description={`${filteredCount} job${filteredCount !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Jobs' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={jobs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => router.push('/admin/jobs/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        }
      />

      <ContentSection className="mt-6">
        <JobFilters
          techs={techs}
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </ContentSection>

      {selectedJobs.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJobs([])}
              >
                Clear
              </Button>
              {(['scheduled', 'in_progress', 'completed'] as JobStatus[]).map(
                (status) => (
                  <ButtonLoader
                    key={status}
                    variant="outline"
                    size="sm"
                    loading={bulkActionLoading}
                    onClick={() => handleBulkStatusChange(status)}
                  >
                    Mark {status.replace('_', ' ')}
                  </ButtonLoader>
                )
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={bulkActionLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('table')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('cards')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('kanban')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={loadJobs} disabled={loading}>
          <RefreshCw
            className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="h-12 w-12" />}
            title="Failed to load jobs"
            description={error}
            action={{
              label: 'Try Again',
              onClick: loadJobs,
            }}
          />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-12 w-12" />}
            title="No jobs found"
            description="Try adjusting your filters or create a new job to get started."
            action={{
              label: 'Create Job',
              onClick: () => router.push('/admin/jobs/new'),
            }}
          />
        ) : viewMode === 'table' ? (
          <JobTable
            jobs={jobs}
            onStatusChange={handleStatusChange}
            onDelete={(id) => {
              setJobToDelete(id);
              setDeleteDialogOpen(true);
            }}
            selectedIds={selectedJobs}
            onSelect={handleSelectJob}
            onSelectAll={handleSelectAll}
          />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onDelete={(id) => {
                  setJobToDelete(id);
                  setDeleteDialogOpen(true);
                }}
                selected={selectedJobs.includes(job.id)}
                onSelect={handleSelectJob}
              />
            ))}
          </div>
        ) : (
          <KanbanBoard
            columns={getKanbanColumns()}
            onItemMove={handleStatusChange}
            renderCard={renderKanbanCard}
            loading={loading}
          />
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Job{selectedJobs.length > 1 ? 's' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedJobs.length > 1
                ? `Are you sure you want to delete ${selectedJobs.length} jobs? This action cannot be undone.`
                : 'Are you sure you want to delete this job? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                selectedJobs.length > 1 ? handleBulkDelete : handleDeleteJob
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
