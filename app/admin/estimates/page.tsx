'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  PageHeader,
  PageContainer,
  EmptyState,
  Spinner,
  Button,
  ButtonLoader,
  StatusBadge,
} from '@/components/ui';
import {
  EstimateFilters,
  EstimateFiltersState,
  EstimateSummaryCards,
} from '@/components/commercial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import type { EstimateWithRelations, EstimateStatus } from '@/types/estimate';
import {
  Plus,
  Download,
  LayoutGrid,
  List,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { exportEstimatesToCSV } from '@/lib/csv-export';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  ),
}) as any;

type ViewMode = 'table' | 'cards' | 'kanban';

const statusVariantMap: Record<
  EstimateStatus,
  'draft' | 'sent' | 'approved' | 'declined' | 'expired'
> = {
  draft: 'draft',
  pending: 'draft',
  sent: 'sent',
  approved: 'approved',
  declined: 'declined',
  expired: 'expired',
  revised: 'sent',
};

export default function EstimatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [estimates, setEstimates] = React.useState<EstimateWithRelations[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    const v = searchParams.get('view') as ViewMode;
    return v === 'cards' || v === 'table' || v === 'kanban' ? v : 'kanban';
  });

  const [filters, setFilters] = React.useState<EstimateFiltersState>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as EstimateStatus | 'all') || 'all',
    clientId: searchParams.get('client') || '',
    dateFrom: searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined,
    dateTo: searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined,
    amountMin: searchParams.get('min')
      ? parseFloat(searchParams.get('min')!)
      : undefined,
    amountMax: searchParams.get('max')
      ? parseFloat(searchParams.get('max')!)
      : undefined,
  }));

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [estimateToDelete, setEstimateToDelete] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.clientId) params.set('client_id', filters.clientId);
      if (filters.dateFrom)
        params.set('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      if (filters.dateTo)
        params.set('dateTo', filters.dateTo.toISOString().split('T')[0]);
      if (filters.amountMin !== undefined)
        params.set('amountMin', filters.amountMin.toString());
      if (filters.amountMax !== undefined)
        params.set('amountMax', filters.amountMax.toString());

      const [estimatesRes, clientsRes] = await Promise.all([
        fetch(`/api/estimates?${params.toString()}`),
        fetch('/api/clients?limit=100'),
      ]);

      if (!estimatesRes.ok) throw new Error('Failed to load estimates');

      const estimatesData = await estimatesRes.json();
      setEstimates(
        Array.isArray(estimatesData.estimates)
          ? estimatesData.estimates
          : estimatesData
      );
      setStats(estimatesData.stats || null);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);
      }
    } catch (err) {
      console.error('Failed to load estimates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load estimates');
      toast({
        title: 'Error',
        description: 'Failed to load estimates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: EstimateFiltersState) => {
    setFilters(newFilters);
    setSelectedIds([]);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleStatusChange = async (
    estimateId: string,
    newStatus: EstimateStatus
  ) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status Updated',
        description: `Estimate moved to ${newStatus}`,
      });

      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleSendEstimate = async (estimateId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to send estimate');

      toast({
        title: 'Estimate Sent',
        description: 'The estimate has been sent to the client',
      });

      loadData();
    } catch (err) {
      console.error('Failed to send estimate:', err);
      toast({
        title: 'Error',
        description: 'Failed to send estimate',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEstimate = async () => {
    if (!estimateToDelete) return;

    try {
      const response = await fetch(`/api/estimates/${estimateToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete estimate');

      toast({
        title: 'Estimate Deleted',
        description: 'The estimate has been removed',
      });

      setEstimates((prev) => prev.filter((e) => e.id !== estimateToDelete));
      setSelectedIds((prev) => prev.filter((id) => id !== estimateToDelete));
    } catch (err) {
      console.error('Failed to delete estimate:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete estimate',
        variant: 'destructive',
      });
    } finally {
      setEstimateToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkStatusChange = async (status: EstimateStatus) => {
    if (selectedIds.length === 0) return;

    try {
      setBulkActionLoading(true);
      const promises = selectedIds.map((id) =>
        fetch(`/api/estimates/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Updated ${selectedIds.length} estimates to ${status}`,
      });

      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error('Bulk status update failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to update estimates',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport =
      selectedIds.length > 0
        ? estimates.filter((e) => selectedIds.includes(e.id))
        : estimates;
    exportEstimatesToCSV(dataToExport);
    toast({
      title: 'Export Complete',
      description: `Exported ${dataToExport.length} estimates`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? estimates.map((e) => e.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const getClientName = (estimate: EstimateWithRelations) => {
    if (estimate.client) {
      return `${estimate.client.first_name} ${estimate.client.last_name}`;
    }
    if (estimate.lead) {
      return `${estimate.lead.first_name} ${estimate.lead.last_name}`;
    }
    return 'No Client';
  };

  const getKanbanColumns = () => [
    {
      id: 'draft',
      title: 'Draft',
      items: estimates.filter((e) => e.status === 'draft'),
      color: 'border-slate-400',
    },
    {
      id: 'sent',
      title: 'Sent',
      items: estimates.filter((e) => e.status === 'sent'),
      color: 'border-blue-400',
    },
    {
      id: 'approved',
      title: 'Approved',
      items: estimates.filter((e) => e.status === 'approved'),
      color: 'border-green-400',
    },
    {
      id: 'declined',
      title: 'Declined',
      items: estimates.filter((e) => e.status === 'declined'),
      color: 'border-red-400',
    },
  ];

  const renderKanbanCard = (estimate: EstimateWithRelations) => (
    <div
      key={estimate.id}
      className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => router.push(`/admin/estimates/${estimate.id}/summary`)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-sm">
          #{estimate.estimate_number}
        </span>
        <StatusBadge variant={statusVariantMap[estimate.status]} size="sm" dot>
          {estimate.status}
        </StatusBadge>
      </div>
      <p className="text-sm font-medium truncate mb-1">{estimate.title}</p>
      <p className="text-xs text-muted-foreground truncate mb-2">
        {getClientName(estimate)}
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {estimate.sent_date
            ? format(new Date(estimate.sent_date), 'MMM d')
            : 'Not sent'}
        </span>
        <span className="font-semibold text-emerald-600">
          ${estimate.total.toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <PageContainer maxWidth="xl" padding="md">
      <PageHeader
        title="Estimates"
        description={`${estimates.length} estimate${estimates.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Estimates' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={estimates.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/estimates/new">
                <Plus className="h-4 w-4 mr-2" />
                New Estimate
              </Link>
            </Button>
          </div>
        }
      />

      {stats && <EstimateSummaryCards stats={stats} className="mt-6" />}

      <div className="mt-6">
        <EstimateFilters
          clients={clients}
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} estimate{selectedIds.length !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
              {(['sent', 'approved'] as EstimateStatus[]).map((status) => (
                <ButtonLoader
                  key={status}
                  variant="outline"
                  size="sm"
                  loading={bulkActionLoading}
                  onClick={() => handleBulkStatusChange(status)}
                >
                  Mark {status}
                </ButtonLoader>
              ))}
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
        <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
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
            title="Failed to load estimates"
            description={error}
            action={{ label: 'Try Again', onClick: loadData }}
          />
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No estimates found"
            description="Try adjusting your filters or create a new estimate to get started."
            action={{
              label: 'Create Estimate',
              onClick: () => router.push('/admin/estimates/new'),
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-24">Estimate #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Client
                    </TableHead>
                    <TableHead className="hidden md:table-cell w-32">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right w-28">Total</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate) => (
                    <TableRow
                      key={estimate.id}
                      className="cursor-pointer hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/estimates/${estimate.id}/summary`}
                          className="hover:text-primary transition-colors"
                        >
                          #{estimate.estimate_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/estimates/${estimate.id}/summary`}
                          className="hover:text-primary transition-colors block max-w-[200px] truncate"
                        >
                          {estimate.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-muted-foreground truncate block max-w-[150px]">
                          {getClientName(estimate)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge
                          variant={statusVariantMap[estimate.status]}
                          size="sm"
                          dot
                        >
                          {estimate.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {estimate.sent_date
                          ? format(new Date(estimate.sent_date), 'MMM d, yyyy')
                          : 'Not sent'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${estimate.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {estimate.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSendEstimate(estimate.id);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/admin/estimates/${estimate.id}/summary`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {estimates.map((estimate) => (
              <div
                key={estimate.id}
                className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold">
                      #{estimate.estimate_number}
                    </span>
                    <StatusBadge
                      variant={statusVariantMap[estimate.status]}
                      size="sm"
                      dot
                      className="ml-2"
                    >
                      {estimate.status}
                    </StatusBadge>
                  </div>
                </div>
                <p className="font-medium truncate mb-1">{estimate.title}</p>
                <p className="text-sm text-muted-foreground truncate mb-3">
                  {getClientName(estimate)}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${estimate.total.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/estimates/${estimate.id}/summary`}>
                        View
                      </Link>
                    </Button>
                    {estimate.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendEstimate(estimate.id)}
                      >
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
            <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this estimate? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEstimate}
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
