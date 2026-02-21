'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-4 lg:px-6 lg:py-6',
  md: 'px-4 py-6 lg:px-8 lg:py-8',
  lg: 'px-6 py-8 lg:px-10 lg:py-10',
};

function PageContainer({
  children,
  className,
  maxWidth = '2xl',
  padding = 'md',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PageContainer.displayName = 'PageContainer';

interface ContentSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  divided?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

function ContentSection({
  title,
  description,
  actions,
  divided = false,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
  ...props
}: ContentSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <section
      className={cn(
        'space-y-4',
        divided && 'border-t border-border pt-6 mt-6',
        className
      )}
      {...props}
    >
      {(title || description || actions || collapsible) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2
                className={cn(
                  'text-lg font-semibold tracking-tight',
                  collapsible &&
                    'cursor-pointer hover:text-primary transition-colors'
                )}
                onClick={
                  collapsible ? () => setIsCollapsed(!isCollapsed) : undefined
                }
              >
                {collapsible && (
                  <span className="mr-2 inline-block transition-transform">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                )}
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">{children}</div>
      )}
    </section>
  );
}

ContentSection.displayName = 'ContentSection';

interface ActionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
  position?: 'top' | 'bottom';
}

function ActionPanel({
  sticky = true,
  position = 'bottom',
  children,
  className,
  ...props
}: ActionPanelProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 py-4',
        sticky &&
          position === 'bottom' &&
          'sticky bottom-0 bg-background/95 backdrop-blur border-t border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        sticky &&
          position === 'top' &&
          'sticky top-0 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 z-10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

ActionPanel.displayName = 'ActionPanel';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

function Grid({
  cols = 3,
  gap = 'md',
  responsive = true,
  children,
  className,
  ...props
}: GridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const colClasses = responsive
    ? {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
      }
    : {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      };

  return (
    <div
      className={cn('grid', colClasses[cols], gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

Grid.displayName = 'Grid';

export { PageContainer, ContentSection, ActionPanel, Grid };
