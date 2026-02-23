'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
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
  Calendar,
  MapPin,
  User,
  DollarSign,
  Clock,
  Edit,
  Eye,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import type { JobWithClient, JobStatus } from '@/types/job';
import { format } from 'date-fns';

interface JobCardProps {
  job: JobWithClient;
  onStatusChange?: (jobId: string, status: JobStatus) => void;
  onDelete?: (jobId: string) => void;
  onQuickAction?: (jobId: string, action: string) => void;
  variant?: 'default' | 'compact' | 'dense';
  className?: string;
  selected?: boolean;
  onSelect?: (jobId: string, selected: boolean) => void;
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

export function JobCard({
  job,
  onStatusChange,
  onDelete,
  onQuickAction,
  variant = 'default',
  className,
  selected,
  onSelect,
}: JobCardProps) {
  const clientName = job.client
    ? (job.client as any).name ||
      `${(job.client as any).first_name || ''} ${(job.client as any).last_name || ''}`.trim()
    : 'No Client';

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(job.id, e.target.checked);
  };

  if (variant === 'dense') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-muted/50 transition-colors',
          selected && 'bg-primary/5',
          className
        )}
      >
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
            className="h-4 w-4 rounded border-gray-300"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">#{job.job_number}</span>
            <span className="text-sm text-muted-foreground truncate">
              {job.title}
            </span>
          </div>
        </div>
        <div className="hidden sm:block text-sm text-muted-foreground truncate max-w-[150px]">
          {clientName}
        </div>
        <StatusBadge variant={statusVariantMap[job.status]} size="sm" dot>
          {job.status.replace('_', ' ')}
        </StatusBadge>
        <div className="hidden md:block text-sm font-medium">
          ${job.total.toLocaleString()}
        </div>
        {job.service_date && (
          <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(job.service_date), 'MMM d')}
          </div>
        )}
        <Link
          href={`/admin/jobs/${job.id}`}
          className="text-primary hover:text-primary/80"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'hover:shadow-md transition-shadow',
          selected && 'ring-2 ring-primary',
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {onSelect && (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={handleSelect}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                )}
                <span className="font-semibold text-sm">#{job.job_number}</span>
                <StatusBadge
                  variant={statusVariantMap[job.status]}
                  size="sm"
                  dot
                >
                  {job.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <h3 className="font-medium text-foreground truncate">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {clientName}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ${job.total.toLocaleString()}
              </p>
              {job.service_date && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(job.service_date), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        selected && 'ring-2 ring-primary',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={handleSelect}
                  className="h-4 w-4 rounded border-gray-300"
                />
              )}
              <span className="font-semibold text-sm text-muted-foreground">
                #{job.job_number}
              </span>
              <StatusBadge variant={statusVariantMap[job.status]} size="sm" dot>
                {job.status.replace('_', ' ')}
              </StatusBadge>
            </div>

            <h3 className="font-semibold text-foreground truncate mb-1">
              {job.title}
            </h3>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">{clientName}</span>
              </div>

              {job.service_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(job.service_date), 'MMM d, yyyy')}
                  </span>
                  {job.scheduled_time && (
                    <>
                      <Clock className="h-3.5 w-3.5 ml-2" />
                      <span>{job.scheduled_time}</span>
                    </>
                  )}
                </div>
              )}

              {job.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {job.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="font-bold text-lg text-foreground">
              ${job.total.toLocaleString()}
            </p>

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
                    onClick={() => onStatusChange?.(job.id, 'in_progress')}
                  >
                    Start Job
                  </DropdownMenuItem>
                )}
                {job.status === 'in_progress' && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(job.id, 'completed')}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
