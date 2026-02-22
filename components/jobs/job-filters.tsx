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
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@/types/job';
import { format } from 'date-fns';

export interface JobFiltersState {
  search: string;
  status: JobStatus | 'all';
  priority: 'all' | 'high' | 'medium' | 'low';
  assignedTech: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface JobFiltersProps {
  techs: Array<{ id: string; full_name?: string; email: string }>;
  onFiltersChange: (filters: JobFiltersState) => void;
  initialFilters?: Partial<JobFiltersState>;
  className?: string;
}

const statusOptions: Array<{ value: JobStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'quote', label: 'Quote' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function JobFilters({
  techs,
  onFiltersChange,
  initialFilters,
  className,
}: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<JobFiltersState>({
    search: searchParams.get('search') || initialFilters?.search || '',
    status:
      (searchParams.get('status') as JobStatus | 'all') ||
      initialFilters?.status ||
      'all',
    priority:
      (searchParams.get('priority') as JobFiltersState['priority']) ||
      initialFilters?.priority ||
      'all',
    assignedTech:
      searchParams.get('tech') || initialFilters?.assignedTech || '',
    dateFrom: searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : initialFilters?.dateFrom,
    dateTo: searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : initialFilters?.dateTo,
  });

  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.assignedTech) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  const updateURL = React.useCallback(
    (newFilters: JobFiltersState) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.status !== 'all') params.set('status', newFilters.status);
      if (newFilters.priority !== 'all')
        params.set('priority', newFilters.priority);
      if (newFilters.assignedTech) params.set('tech', newFilters.assignedTech);
      if (newFilters.dateFrom)
        params.set('dateFrom', newFilters.dateFrom.toISOString().split('T')[0]);
      if (newFilters.dateTo)
        params.set('dateTo', newFilters.dateTo.toISOString().split('T')[0]);

      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const handleFilterChange = React.useCallback(
    <K extends keyof JobFiltersState>(key: K, value: JobFiltersState[K]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
      updateURL(newFilters);
    },
    [filters, onFiltersChange, updateURL]
  );

  const clearFilters = React.useCallback(() => {
    const cleared: JobFiltersState = {
      search: '',
      status: 'all',
      priority: 'all',
      assignedTech: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(cleared);
    onFiltersChange(cleared);
    updateURL(cleared);
  }, [onFiltersChange, updateURL]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={handleKeyDown}
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

        <Select
          value={filters.status}
          onValueChange={(v) =>
            handleFilterChange('status', v as JobStatus | 'all')
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

        <Select
          value={filters.priority}
          onValueChange={(v) =>
            handleFilterChange('priority', v as JobFiltersState['priority'])
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.assignedTech}
          onValueChange={(v) => handleFilterChange('assignedTech', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Assigned Tech" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Techs</SelectItem>
            {techs.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.full_name || tech.email}
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
              selected={{
                from: filters.dateFrom,
                to: filters.dateTo,
              }}
              onSelect={(range) => {
                handleFilterChange('dateFrom', range?.from);
                handleFilterChange('dateTo', range?.to);
                if (range?.from && range?.to) {
                  setDatePickerOpen(false);
                }
              }}
              numberOfMonths={2}
            />
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
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status:{' '}
              {statusOptions.find((s) => s.value === filters.status)?.label}
              <button onClick={() => handleFilterChange('status', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priority !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Priority: {filters.priority}
              <button onClick={() => handleFilterChange('priority', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.assignedTech && (
            <Badge variant="secondary" className="gap-1">
              Tech:{' '}
              {techs.find((t) => t.id === filters.assignedTech)?.full_name ||
                'Unknown'}
              <button onClick={() => handleFilterChange('assignedTech', '')}>
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
