'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  InvoiceFilters,
  InvoiceFiltersState,
  InvoiceSummaryCards,
} from '@/components/commercial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceWithRelations, InvoiceStatus } from '@/types/invoice';
import {
  Plus,
  Download,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

type ViewMode = 'table' | 'cards';

const statusVariantMap: Record<
  InvoiceStatus,
  'draft' | 'sent' | 'partial' | 'paid' | 'void'
> = {
  draft: 'draft',
  sent: 'sent',
  partial: 'partial',
  paid: 'paid',
  void: 'void',
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [invoices, setInvoices] = React.useState<InvoiceWithRelations[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    const v = searchParams.get('view') as ViewMode;
    return v === 'cards' || v === 'table' ? v : 'table';
  });

  const [filters, setFilters] = React.useState<InvoiceFiltersState>(() => ({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as InvoiceStatus | 'all') || 'all',
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

      const [invoicesRes, clientsRes] = await Promise.all([
        fetch(`/api/invoices?${params.toString()}`),
        fetch('/api/clients?limit=100'),
      ]);

      if (!invoicesRes.ok) throw new Error('Failed to load invoices');

      const invoicesData = await invoicesRes.json();
      setInvoices(
        Array.isArray(invoicesData.invoices)
          ? invoicesData.invoices
          : invoicesData
      );
      setStats(invoicesData.stats || null);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: InvoiceFiltersState) => {
    setFilters(newFilters);
    setSelectedIds([]);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleExport = () => {
    const dataToExport =
      selectedIds.length > 0
        ? invoices.filter((i) => selectedIds.includes(i.id))
        : invoices;

    const csvContent = [
      [
        'Invoice #',
        'Client',
        'Status',
        'Issue Date',
        'Due Date',
        'Total',
        'Balance Due',
      ].join(','),
      ...dataToExport.map((inv) =>
        [
          inv.invoice_number,
          `"${inv.client?.first_name} ${inv.client?.last_name}"`,
          inv.status,
          inv.issue_date ? format(parseISO(inv.issue_date), 'yyyy-MM-dd') : '',
          inv.due_date ? format(parseISO(inv.due_date), 'yyyy-MM-dd') : '',
          inv.total.toFixed(2),
          inv.balance_due.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${dataToExport.length} invoices`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? invoices.map((i) => i.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkActionLoading(true);
      const promises = selectedIds.map((id) =>
        fetch(`/api/invoices/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid' }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Marked ${selectedIds.length} invoices as paid`,
      });

      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error('Bulk update failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to update invoices',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getClientName = (invoice: InvoiceWithRelations) => {
    if (invoice.client) {
      return `${invoice.client.first_name} ${invoice.client.last_name}`;
    }
    return 'No Client';
  };

  const getDaysOverdue = (invoice: InvoiceWithRelations): number | null => {
    if (
      invoice.status === 'paid' ||
      invoice.status === 'void' ||
      !invoice.due_date
    )
      return null;
    const dueDate = parseISO(invoice.due_date);
    const days = differenceInDays(new Date(), dueDate);
    return days > 0 ? days : null;
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <PageContainer maxWidth="xl" padding="md">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Invoices' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={invoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
        }
      />

      {stats && <InvoiceSummaryCards stats={stats} className="mt-6" />}

      <div className="mt-6">
        <InvoiceFilters
          clients={clients}
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} invoice{selectedIds.length !== 1 ? 's' : ''}{' '}
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
              <ButtonLoader
                variant="default"
                size="sm"
                loading={bulkActionLoading}
                onClick={handleBulkMarkPaid}
              >
                Mark Paid
              </ButtonLoader>
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
            title="Failed to load invoices"
            description={error}
            action={{ label: 'Try Again', onClick: loadData }}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No invoices found"
            description="Try adjusting your filters or create invoices from completed jobs."
            action={{
              label: 'View Jobs',
              onClick: () => router.push('/admin/jobs'),
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-28">Invoice #</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Client
                    </TableHead>
                    <TableHead className="hidden md:table-cell w-32">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Issue Date
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Due Date
                    </TableHead>
                    <TableHead className="text-right w-28">Total</TableHead>
                    <TableHead className="text-right w-28">Balance</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice);
                    return (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/invoices/${invoice.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {invoice.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-muted-foreground truncate block max-w-[150px]">
                            {getClientName(invoice)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <StatusBadge
                              variant={statusVariantMap[invoice.status]}
                              size="sm"
                              dot
                            >
                              {invoice.status}
                            </StatusBadge>
                            {daysOverdue && (
                              <span className="text-xs text-red-600 font-medium">
                                {daysOverdue}d overdue
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {invoice.issue_date
                            ? format(
                                parseISO(invoice.issue_date),
                                'MMM d, yyyy'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {invoice.due_date
                            ? format(parseISO(invoice.due_date), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-semibold',
                              invoice.balance_due > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            )}
                          >
                            {formatCurrency(invoice.balance_due)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice);
              return (
                <div
                  key={invoice.id}
                  className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold">
                        {invoice.invoice_number}
                      </span>
                      <StatusBadge
                        variant={statusVariantMap[invoice.status]}
                        size="sm"
                        dot
                        className="ml-2"
                      >
                        {invoice.status}
                      </StatusBadge>
                    </div>
                    {daysOverdue && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">
                        {daysOverdue}d overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-3">
                    {getClientName(invoice)}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">
                      {invoice.due_date
                        ? `Due ${format(parseISO(invoice.due_date), 'MMM d')}`
                        : 'No due date'}
                    </span>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </p>
                      {invoice.balance_due > 0 && (
                        <p className="text-xs text-red-600">
                          Balance: {formatCurrency(invoice.balance_due)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/admin/invoices/${invoice.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {invoice.balance_due > 0 && (
                      <Button size="sm" className="flex-1" asChild>
                        <Link
                          href={`/admin/invoices/${invoice.id}?recordPayment=true`}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Record Payment
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
