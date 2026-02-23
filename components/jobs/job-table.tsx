'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Clock,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import type { JobWithClient, JobStatus } from '@/types/job';
import { format } from 'date-fns';

interface JobTableProps {
  jobs: JobWithClient[];
  onStatusChange?: (jobId: string, status: JobStatus) => void;
  onDelete?: (jobId: string) => void;
  selectedIds?: string[];
  onSelect?: (jobId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  className?: string;
  loading?: boolean;
}

const statusVariantMap: Record<
  JobStatus,
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'quote'
  | 'draft'
  | 'invoiced'
> = {
  draft: 'draft',
  quote: 'quote',
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  invoiced: 'invoiced',
  cancelled: 'cancelled',
};

export function JobTable({
  jobs,
  onStatusChange,
  onDelete,
  selectedIds = [],
  onSelect,
  onSelectAll,
  className,
  loading,
}: JobTableProps) {
  const allSelected =
    jobs.length > 0 && jobs.every((j) => selectedIds.includes(j.id));
  const someSelected = jobs.some((j) => selectedIds.includes(j.id));

  const getClientName = (job: JobWithClient) => {
    if (!job.client) return 'No Client';
    return (
      (job.client as any).name ||
      `${(job.client as any).first_name || ''} ${(job.client as any).last_name || ''}`.trim() ||
      'No Name'
    );
  };

  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="p-8 text-center text-muted-foreground">
          Loading jobs...
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {onSelect && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      onSelectAll?.(checked as boolean)
                    }
                    aria-label="Select all"
                    className={cn(someSelected && !allSelected && 'opacity-50')}
                  />
                </TableHead>
              )}
              <TableHead className="w-24">Job #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Client</TableHead>
              <TableHead className="hidden md:table-cell w-32">
                Status
              </TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right w-28">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const isSelected = selectedIds.includes(job.id);
              return (
                <TableRow
                  key={job.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/30 transition-colors',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  {onSelect && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onSelect(job.id, checked as boolean)
                        }
                        aria-label={`Select job ${job.job_number}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      #{job.job_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="hover:text-primary transition-colors block max-w-[200px] truncate"
                    >
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground truncate block max-w-[150px]">
                      {getClientName(job)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge
                      variant={statusVariantMap[job.status]}
                      size="sm"
                      dot
                    >
                      {job.status.replace('_', ' ')}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {job.service_date ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(job.service_date), 'MMM d')}
                        {job.scheduled_time && (
                          <>
                            <Clock className="h-3.5 w-3.5 ml-1" />
                            <span className="text-xs">
                              {job.scheduled_time}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Not scheduled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${job.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/jobs/${job.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/jobs/${job.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === 'scheduled' && (
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange?.(job.id, 'in_progress')
                            }
                          >
                            Start Job
                          </DropdownMenuItem>
                        )}
                        {job.status === 'in_progress' && (
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange?.(job.id, 'completed')
                            }
                          >
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {job.status === 'completed' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange?.(job.id, 'invoiced')}
                          >
                            Create Invoice
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(job.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
