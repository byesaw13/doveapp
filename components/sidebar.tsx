'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Package,
  Clock,
  Menu,
  X,
  BarChart3,
  Target,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

import type { SidebarNotificationCounts } from '@/app/api/sidebar/notifications/route';
import type { SidebarPerformanceData } from '@/app/api/sidebar/performance/route';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: keyof SidebarNotificationCounts;
  shortcut?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigationGroups: NavGroup[] = [
  {
    name: 'Business Overview',
    defaultOpen: true,
    items: [
      {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        shortcut: 'D',
      },
      { name: 'KPI', href: '/kpi', icon: BarChart3, shortcut: 'K' },
    ],
  },
  {
    name: 'Sales & Opportunities',
    defaultOpen: true,
    items: [
      {
        name: 'Leads',
        href: '/leads',
        icon: Users,
        badge: 'newLeads',
        shortcut: 'L',
      },
      {
        name: 'Estimates',
        href: '/estimates',
        icon: FileText,
        badge: 'pendingEstimates',
        shortcut: 'E',
      },
    ],
  },
  {
    name: 'Operations',
    defaultOpen: true,
    items: [
      {
        name: 'Calendar',
        href: '/calendar',
        icon: Calendar,
        shortcut: 'C',
      },
      {
        name: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
        badge: 'overdueJobs',
        shortcut: 'J',
      },
      {
        name: 'Time Tracking',
        href: '/time-tracking',
        icon: Clock,
        shortcut: 'T',
      },
    ],
  },
  {
    name: 'Relationships',
    defaultOpen: true,
    items: [
      { name: 'Clients', href: '/clients', icon: Users, shortcut: 'U' },
      { name: 'Help', href: '/help', icon: HelpCircle, shortcut: 'H' },
    ],
  },
  {
    name: 'Resources',
    defaultOpen: false,
    items: [
      {
        name: 'Inventory',
        href: '/inventory',
        icon: Package,
        badge: 'lowInventoryItems',
        shortcut: 'I',
      },
    ],
  },
  {
    name: 'Administration',
    defaultOpen: false,
    items: [
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        shortcut: 'S',
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [mounted, setMounted] = useState(false);

  // Initialize collapsed groups after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') {
      return;
    }

    const stored = localStorage.getItem('sidebar-collapsed-groups');

    if (stored) {
      try {
        setCollapsedGroups(new Set(JSON.parse(stored)));
        return;
      } catch (e) {
        console.error('Failed to parse collapsed groups:', e);
      }
    }

    const initialCollapsed = new Set<string>();
    navigationGroups.forEach((group) => {
      if (!group.defaultOpen) {
        initialCollapsed.add(group.name);
      }
    });

    setCollapsedGroups(initialCollapsed);
  }, []);
  const [notifications, setNotifications] = useState<SidebarNotificationCounts>(
    {
      pendingEstimates: 0,
      overdueJobs: 0,
      newLeads: 0,
      lowInventoryItems: 0,
    }
  );
  const [performance, setPerformance] = useState<SidebarPerformanceData>({
    todayJobsCount: 0,
    todayJobsScheduled: 0,
    weekRevenue: 0,
    weekRevenueTarget: 5000,
    outstandingInvoices: 0,
    outstandingInvoicesAmount: 0,
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(
      'sidebar-collapsed-groups',
      JSON.stringify(Array.from(collapsedGroups))
    );
  }, [collapsedGroups]);

  // Fetch notification counts
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/sidebar/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Fetch performance data
  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch('/api/sidebar/performance');
      if (res.ok) {
        const data = await res.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  }, []);

  // Initial load and refresh every 30 seconds
  useEffect(() => {
    const runFetches = async () => {
      await fetchNotifications();
      await fetchPerformance();
    };

    void runFetches();

    const interval = setInterval(() => {
      void runFetches();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPerformance]);

  // Keyboard shortcuts for navigation (Alt+Key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toUpperCase();
        navigationGroups.forEach((group) => {
          group.items.forEach((item) => {
            if (item.shortcut === key) {
              e.preventDefault();
              router.push(item.href);
              setIsMobileMenuOpen(false);
            }
          });
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const toggleGroup = (groupName: string): void => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleSwipe = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch.clientX < 50 && !isMobileMenuOpen) {
        setIsMobileMenuOpen(true);
      } else if (touch.clientX > 256 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    },
    [isMobileMenuOpen]
  );

  useEffect(() => {
    document.addEventListener('touchend', handleSwipe);
    return () => document.removeEventListener('touchend', handleSwipe);
  }, [handleSwipe]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (): number => {
    if (performance.weekRevenueTarget === 0) return 0;
    return Math.min(
      (performance.weekRevenue / performance.weekRevenueTarget) * 100,
      100
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Jobber style */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Monday.com style with blue accent */}
          <div className="flex items-center px-6 h-16 border-b border-border bg-gradient-to-r from-primary/5 to-background">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-lg">
                  H
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                FieldOps Pro
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-3 pt-4 pb-2 border-b border-slate-100">
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 px-1 text-xs gap-1"
                onClick={() => {
                  router.push('/jobs/new');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Job
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 px-1 text-xs gap-1"
                onClick={() => {
                  router.push('/clients?new=true');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Client
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 px-1 text-xs gap-1"
                onClick={() => {
                  router.push('/estimates?new=true');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Estimate
              </Button>
            </div>
          </div>

          {/* Navigation - Grouped */}
          <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
            {navigationGroups.map((group) => {
              const isCollapsed = mounted
                ? collapsedGroups.has(group.name)
                : !group.defaultOpen;
              return (
                <div key={group.name} className="space-y-1">
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors w-full"
                    onClick={() => toggleGroup(group.name)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {group.name}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        const badgeCount = item.badge
                          ? notifications[item.badge]
                          : 0;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group',
                              isActive
                                ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                            title={
                              item.shortcut
                                ? `${item.name} (Alt+${item.shortcut})`
                                : item.name
                            }
                          >
                            <item.icon
                              className={cn(
                                'h-5 w-5 transition-colors flex-shrink-0',
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground/60 group-hover:text-foreground'
                              )}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                            {badgeCount > 0 && (
                              <Badge
                                variant={isActive ? 'default' : 'secondary'}
                                className={cn(
                                  'h-5 min-w-5 px-1.5 text-xs',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-destructive/10 text-destructive'
                                )}
                              >
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </Badge>
                            )}
                            {isActive && (
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Performance Widget */}
          <div className="px-3 pb-3 border-t border-border">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-3 mt-3 space-y-2 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Today&apos;s Jobs
                </span>
                <span className="text-primary font-bold">
                  {performance.todayJobsScheduled}/{performance.todayJobsCount}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Week Revenue
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(performance.weekRevenue)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-right">
                  Target: {formatCurrency(performance.weekRevenueTarget)}
                </div>
              </div>
              {performance.outstandingInvoices > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Outstanding
                  </span>
                  <span className="font-semibold text-chart-3">
                    {formatCurrency(performance.outstandingInvoicesAmount)}
                  </span>
                </div>
              )}
              {notifications.overdueJobs > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive pt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="font-medium">
                    {notifications.overdueJobs} overdue job
                    {notifications.overdueJobs !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Monday.com style */}
          <div className="p-4 border-t border-border bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">
                  FieldOps Pro
                </div>
                <div>Field Service Management</div>
                <div className="text-[10px] text-muted-foreground/70 pt-1">
                  v0.1.0
                </div>
              </div>
              <ThemeToggle />
            </div>

            {/* Logout Button - TODO: Implement proper logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/auth/login';
              }}
              className="w-full text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
