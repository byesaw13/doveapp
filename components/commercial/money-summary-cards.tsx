'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface MoneySummaryCardsProps {
  cards: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MoneySummaryCards({
  cards,
  columns = 4,
  className,
}: MoneySummaryCardsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  const variantStyles = {
    default: 'bg-card',
    success:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
    warning:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
    danger: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            'transition-shadow hover:shadow-md',
            variantStyles[card.variant || 'default']
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1 truncate">
                  {typeof card.value === 'number'
                    ? `$${card.value.toLocaleString()}`
                    : card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                )}
                {card.trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs mt-1',
                      card.trend === 'up' && 'text-emerald-600',
                      card.trend === 'down' && 'text-red-600',
                      card.trend === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {card.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {card.trend === 'down' && (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </div>
                )}
              </div>
              {card.icon && (
                <div
                  className={cn(
                    'flex-shrink-0',
                    iconColors[card.variant || 'default']
                  )}
                >
                  {card.icon}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EstimateSummaryCards({
  stats,
  className,
}: {
  stats: {
    total_estimates?: number;
    draft_estimates?: number;
    sent_estimates?: number;
    accepted_estimates?: number;
    total_value?: number;
    accepted_value?: number;
    outstanding_value?: number;
  };
  className?: string;
}) {
  const cards = [
    {
      title: 'Total Estimates',
      value: stats.total_estimates || 0,
      icon: <FileText className="h-5 w-5" />,
      variant: 'default' as const,
    },
    {
      title: 'Pending',
      value: stats.sent_estimates || 0,
      icon: <Clock className="h-5 w-5" />,
      variant: 'warning' as const,
    },
    {
      title: 'Accepted',
      value: stats.accepted_estimates || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const,
    },
    {
      title: 'Total Value',
      value: `$${(stats.total_value || 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'info' as const,
    },
  ];

  return <MoneySummaryCards cards={cards} columns={4} className={className} />;
}

export function InvoiceSummaryCards({
  stats,
  className,
}: {
  stats: {
    total_invoices?: number;
    paid_invoices?: number;
    total_revenue?: number;
    outstanding_balance?: number;
    overdue_count?: number;
  };
  className?: string;
}) {
  const cards = [
    {
      title: 'Total Invoices',
      value: stats.total_invoices || 0,
      icon: <FileText className="h-5 w-5" />,
      variant: 'default' as const,
    },
    {
      title: 'Paid',
      value: stats.paid_invoices || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const,
    },
    {
      title: 'Outstanding',
      value: `$${(stats.outstanding_balance || 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'warning' as const,
      subtitle: stats.overdue_count
        ? `${stats.overdue_count} overdue`
        : undefined,
    },
    {
      title: 'Revenue',
      value: `$${(stats.total_revenue || 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'info' as const,
    },
  ];

  return <MoneySummaryCards cards={cards} columns={4} className={className} />;
}
