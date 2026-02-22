'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50',
  {
    variants: {
      variant: {
        success:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        neutral:
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        draft:
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        pending:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        in_progress:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        completed:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        cancelled:
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        unpaid:
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        partial:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        declined:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        scheduled:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        quote:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        invoiced:
          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs rounded',
        md: 'px-2.5 py-1 text-xs rounded-md',
        lg: 'px-3 py-1.5 text-sm rounded-md',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      dot: false,
    },
  }
);

export interface StatusBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

function StatusBadge({
  className,
  variant,
  size,
  dot,
  icon,
  pulse,
  children,
  ...props
}: StatusBadgeProps) {
  const dotColors: Record<string, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    draft: 'bg-slate-400',
    pending: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    overdue: 'bg-red-500',
    paid: 'bg-emerald-500',
    unpaid: 'bg-slate-400',
    partial: 'bg-amber-500',
    approved: 'bg-emerald-500',
    declined: 'bg-red-500',
    sent: 'bg-blue-500',
    scheduled: 'bg-blue-500',
    quote: 'bg-purple-500',
    invoiced: 'bg-purple-500',
  };

  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors[variant || 'neutral'],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusBadgeVariants };
