'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dataCardVariants = cva(
  'rounded-lg border bg-card text-card-foreground transition-all',
  {
    variants: {
      variant: {
        default: 'shadow-sm hover:shadow-md',
        metric: 'shadow-sm',
        interactive:
          'shadow-sm hover:shadow-md cursor-pointer hover:border-primary/30',
        flat: 'border-0 bg-muted/50',
        outlined: 'bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface DataCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataCardVariants> {
  asChild?: boolean;
}

function DataCard({ className, variant, padding, ...props }: DataCardProps) {
  return (
    <div
      className={cn(dataCardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

DataCard.displayName = 'DataCard';

function DataCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
  );
}

DataCardHeader.displayName = 'DataCardHeader';

function DataCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

DataCardTitle.displayName = 'DataCardTitle';

function DataCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

DataCardDescription.displayName = 'DataCardDescription';

function DataCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4', className)} {...props} />;
}

DataCardContent.displayName = 'DataCardContent';

function DataCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-4', className)} {...props} />;
}

DataCardFooter.displayName = 'DataCardFooter';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({
  title,
  value,
  change,
  icon,
  className,
  trend = 'neutral',
}: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  return (
    <DataCard variant="metric" className={cn('relative', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1 text-xs">
              <span className={trendColors[trend]}>
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {change.value > 0 ? '+' : ''}
                {change.value}%
              </span>
              {change.label && (
                <span className="text-muted-foreground">{change.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </DataCard>
  );
}

MetricCard.displayName = 'MetricCard';

export {
  DataCard,
  DataCardHeader,
  DataCardTitle,
  DataCardDescription,
  DataCardContent,
  DataCardFooter,
  MetricCard,
  dataCardVariants,
};
