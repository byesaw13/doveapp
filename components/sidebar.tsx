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
  Mail,
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
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        name: 'Lead Inbox',
        href: '/leads/inbox',
        icon: Target,
        badge: 'newLeads',
        shortcut: 'L',
      },
      {
        name: 'All Leads',
        href: '/leads',
        icon: Users,
        shortcut: 'A',
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
      {
        name: 'Email',
        href: '/emails',
        icon: Mail,
        badge: 'unreadEmails',
        shortcut: 'M',
      },
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
  const [notifications, setNotifications] = useState<SidebarNotificationCounts>(
    {
      unreadEmails: 0,
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

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed-groups');
    if (stored) {
      try {
        setCollapsedGroups(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to parse collapsed groups:', e);
      }
    } else {
      // Set initial collapsed state based on defaultOpen
      const initialCollapsed = new Set<string>();
      navigationGroups.forEach((group) => {
        if (!group.defaultOpen) {
          initialCollapsed.add(group.name);
        }
      });
      setCollapsedGroups(initialCollapsed);
    }
  }, []);

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
    fetchNotifications();
    fetchPerformance();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPerformance();
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Jobber style with green accent */}
          <div className="flex items-center px-6 h-16 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">DoveApp</h1>
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
              const isCollapsed = collapsedGroups.has(group.name);
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
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
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
                                  ? 'text-emerald-600'
                                  : 'text-slate-400 group-hover:text-slate-600'
                              )}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                            {badgeCount > 0 && (
                              <Badge
                                variant={isActive ? 'default' : 'secondary'}
                                className={cn(
                                  'h-5 min-w-5 px-1.5 text-xs',
                                  isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-100 text-red-700'
                                )}
                              >
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </Badge>
                            )}
                            {isActive && (
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
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
          <div className="px-3 pb-3 border-t border-slate-100">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-3 mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Today&apos;s Jobs
                </span>
                <span className="text-emerald-600 font-bold">
                  {performance.todayJobsScheduled}/{performance.todayJobsCount}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Week Revenue
                  </span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(performance.weekRevenue)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Target: {formatCurrency(performance.weekRevenueTarget)}
                </div>
              </div>
              {performance.outstandingInvoices > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Outstanding
                  </span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(performance.outstandingInvoicesAmount)}
                  </span>
                </div>
              )}
              {notifications.overdueJobs > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-600 pt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="font-medium">
                    {notifications.overdueJobs} overdue job
                    {notifications.overdueJobs !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Jobber style */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">DoveApp</div>
              <div>Field Service Management</div>
              <div className="text-[10px] text-slate-400 pt-1">v0.1.0</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
