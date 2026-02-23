'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/invoice';
import { format } from 'date-fns';

export interface InvoiceFiltersState {
  search: string;
  status: InvoiceStatus | 'all';
  clientId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  amountMin: number | undefined;
  amountMax: number | undefined;
}

interface InvoiceFiltersProps {
  clients: Array<{
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  }>;
  onFiltersChange: (filters: InvoiceFiltersState) => void;
  initialFilters?: Partial<InvoiceFiltersState>;
  showStatusTabs?: boolean;
  className?: string;
}

const statusOptions: Array<{ value: InvoiceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

export function InvoiceFilters({
  clients,
  onFiltersChange,
  initialFilters,
  showStatusTabs = true,
  className,
}: InvoiceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<InvoiceFiltersState>({
    search: searchParams.get('search') || initialFilters?.search || '',
    status:
      (searchParams.get('status') as InvoiceStatus | 'all') ||
      initialFilters?.status ||
      'all',
    clientId: searchParams.get('client') || initialFilters?.clientId || '',
    dateFrom: searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : initialFilters?.dateFrom,
    dateTo: searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : initialFilters?.dateTo,
    amountMin: searchParams.get('min')
      ? parseFloat(searchParams.get('min')!)
      : initialFilters?.amountMin,
    amountMax: searchParams.get('max')
      ? parseFloat(searchParams.get('max')!)
      : initialFilters?.amountMax,
  });

  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.clientId) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin !== undefined || filters.amountMax !== undefined)
      count++;
    return count;
  }, [filters]);

  const updateURL = React.useCallback(
    (newFilters: InvoiceFiltersState) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.status !== 'all') params.set('status', newFilters.status);
      if (newFilters.clientId) params.set('client', newFilters.clientId);
      if (newFilters.dateFrom)
        params.set('dateFrom', newFilters.dateFrom.toISOString().split('T')[0]);
      if (newFilters.dateTo)
        params.set('dateTo', newFilters.dateTo.toISOString().split('T')[0]);
      if (newFilters.amountMin !== undefined)
        params.set('min', newFilters.amountMin.toString());
      if (newFilters.amountMax !== undefined)
        params.set('max', newFilters.amountMax.toString());

      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const handleFilterChange = React.useCallback(
    <K extends keyof InvoiceFiltersState>(
      key: K,
      value: InvoiceFiltersState[K]
    ) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
      updateURL(newFilters);
    },
    [filters, onFiltersChange, updateURL]
  );

  const clearFilters = React.useCallback(() => {
    const cleared: InvoiceFiltersState = {
      search: '',
      status: 'all',
      clientId: '',
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: undefined,
      amountMax: undefined,
    };
    setFilters(cleared);
    onFiltersChange(cleared);
    updateURL(cleared);
  }, [onFiltersChange, updateURL]);

  return (
    <div className={cn('space-y-3', className)}>
      {showStatusTabs && (
        <Tabs
          value={filters.status}
          onValueChange={(v) =>
            handleFilterChange('status', v as InvoiceStatus | 'all')
          }
        >
          <TabsList className="grid w-full grid-cols-6">
            {statusOptions.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search invoices..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-8"
          />
          {filters.search && (
            <button
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!showStatusTabs && (
          <Select
            value={filters.status}
            onValueChange={(v) =>
              handleFilterChange('status', v as InvoiceStatus | 'all')
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.clientId || 'all'}
          onValueChange={(v) =>
            handleFilterChange('clientId', v === 'all' ? '' : v)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
                {client.company_name && ` - ${client.company_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom || filters.dateTo ? (
                <span className="truncate">
                  {filters.dateFrom && filters.dateTo
                    ? `${format(filters.dateFrom, 'MMM d')} - ${format(filters.dateTo, 'MMM d')}`
                    : filters.dateFrom
                      ? `From ${format(filters.dateFrom, 'MMM d')}`
                      : `Until ${format(filters.dateTo!, 'MMM d')}`}
                </span>
              ) : (
                'Date Range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: filters.dateFrom, to: filters.dateTo }}
              onSelect={(range) => {
                handleFilterChange('dateFrom', range?.from);
                handleFilterChange('dateTo', range?.to);
                if (range?.from && range?.to) setDatePickerOpen(false);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Amount
              {(filters.amountMin !== undefined ||
                filters.amountMax !== undefined) && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filters.amountMin !== undefined &&
                  filters.amountMax !== undefined
                    ? `$${filters.amountMin}-${filters.amountMax}`
                    : filters.amountMin !== undefined
                      ? `$${filters.amountMin}+`
                      : `<$${filters.amountMax}`}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Minimum
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'amountMin',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Maximum
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.amountMax ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'amountMax',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="mt-1"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  handleFilterChange('amountMin', undefined);
                  handleFilterChange('amountMax', undefined);
                }}
              >
                Clear Amount
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button onClick={() => handleFilterChange('search', '')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status !== 'all' && !showStatusTabs && (
            <Badge variant="secondary" className="gap-1">
              Status:{' '}
              {statusOptions.find((s) => s.value === filters.status)?.label}
              <button onClick={() => handleFilterChange('status', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.clientId && (
            <Badge variant="secondary" className="gap-1">
              Client:{' '}
              {clients.find((c) => c.id === filters.clientId)?.first_name ||
                'Unknown'}
              <button onClick={() => handleFilterChange('clientId', '')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Date:{' '}
              {filters.dateFrom ? format(filters.dateFrom, 'MMM d') : '...'} -{' '}
              {filters.dateTo ? format(filters.dateTo, 'MMM d') : '...'}
              <button
                onClick={() => {
                  handleFilterChange('dateFrom', undefined);
                  handleFilterChange('dateTo', undefined);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
