'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backButton?: {
    href: string;
    label?: string;
  };
  tabs?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  backButton,
  tabs,
  className,
  size = 'md',
}: PageHeaderProps) {
  const titleSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {backButton && (
            <a
              href={backButton.href}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {backButton.label || 'Back'}
            </a>
          )}
          <h1
            className={cn(
              'font-semibold tracking-tight text-foreground',
              titleSizes[size]
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {tabs && (
        <div className="border-b border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {tabs}
        </div>
      )}
    </div>
  );
}

PageHeader.displayName = 'PageHeader';

export { PageHeader };
export type { PageHeaderProps };
