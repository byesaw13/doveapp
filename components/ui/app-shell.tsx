'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
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
  TrendingUp,
  DollarSign,
  AlertCircle,
  Settings,
  HelpCircle,
  Search,
  Mail,
  PieChart,
  Bell,
  User,
  LogOut,
  Home,
} from 'lucide-react';
import type { SidebarNotificationCounts } from '@/app/api/sidebar/notifications/route';
import type { SidebarPerformanceData } from '@/app/api/sidebar/performance/route';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    name: 'Overview',
    defaultOpen: true,
    items: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        shortcut: 'D',
      },
      { name: 'Today', href: '/admin/today', icon: Calendar, shortcut: 'Y' },
      { name: 'Search', href: '/admin/search', icon: Search, shortcut: 'F' },
    ],
  },
  {
    name: 'Sales & Revenue',
    defaultOpen: true,
    items: [
      {
        name: 'Leads',
        href: '/admin/leads',
        icon: Target,
        badge: 'newLeads',
        shortcut: 'L',
      },
      {
        name: 'Estimates',
        href: '/admin/estimates',
        icon: FileText,
        badge: 'pendingEstimates',
        shortcut: 'E',
      },
      {
        name: 'Invoices',
        href: '/admin/invoices',
        icon: DollarSign,
        shortcut: 'V',
      },
      { name: 'Inbox', href: '/admin/inbox', icon: Mail, shortcut: 'M' },
    ],
  },
  {
    name: 'Operations',
    defaultOpen: true,
    items: [
      {
        name: 'Jobs',
        href: '/admin/jobs',
        icon: Briefcase,
        badge: 'overdueJobs',
        shortcut: 'J',
      },
      {
        name: 'Calendar',
        href: '/admin/schedule',
        icon: Calendar,
        shortcut: 'C',
      },
      {
        name: 'Time Tracking',
        href: '/admin/time-tracking',
        icon: Clock,
        shortcut: 'K',
      },
    ],
  },
  {
    name: 'Customers & Properties',
    defaultOpen: true,
    items: [
      { name: 'Clients', href: '/admin/clients', icon: Users, shortcut: 'U' },
      {
        name: 'Properties',
        href: '/admin/properties',
        icon: Home,
        shortcut: 'P',
      },
    ],
  },
  {
    name: 'Analytics & Reports',
    defaultOpen: false,
    items: [
      {
        name: 'KPI Dashboard',
        href: '/admin/kpi',
        icon: BarChart3,
        shortcut: '1',
      },
      {
        name: 'Customer Analytics',
        href: '/admin/analytics/customers',
        icon: PieChart,
        shortcut: '2',
      },
      {
        name: 'Business Intelligence',
        href: '/admin/business-intelligence',
        icon: TrendingUp,
        shortcut: '3',
      },
    ],
  },
  {
    name: 'Resources',
    defaultOpen: false,
    items: [
      {
        name: 'Pricebook',
        href: '/admin/pricebook/inspector',
        icon: DollarSign,
        shortcut: 'B',
      },
      {
        name: 'Inventory',
        href: '/admin/inventory',
        icon: Package,
        badge: 'lowInventoryItems',
        shortcut: 'I',
      },
      {
        name: 'Invoice Reminders',
        href: '/admin/invoice-reminders',
        icon: AlertCircle,
        shortcut: 'R',
      },
    ],
  },
  {
    name: 'Team & Settings',
    defaultOpen: false,
    items: [
      { name: 'Team Members', href: '/admin/team', icon: Users, shortcut: 'N' },
      {
        name: 'Team Scheduling',
        href: '/admin/team/scheduling',
        icon: Calendar,
        shortcut: 'H',
      },
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        shortcut: 'S',
      },
      {
        name: 'Help & Support',
        href: '/admin/help',
        icon: HelpCircle,
        shortcut: 'Q',
      },
    ],
  },
];

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

interface HeaderContextValue {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  pageTitle?: string;
  setPageTitle: (title?: string) => void;
}

const HeaderContext = React.createContext<HeaderContextValue | undefined>(
  undefined
);

function useHeader(): HeaderContextValue {
  const context = React.useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within AppShell');
  }
  return context;
}

function Header() {
  const { isSidebarOpen, setIsSidebarOpen, pageTitle } = useHeader();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    sessionStorage.clear();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 h-14 lg:h-16 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <Link
            href="/admin/dashboard"
            className="hidden lg:flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <img
                src="/dovetails-logo.png"
                alt="Dovetails"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-bold text-lg">DovePro</span>
          </Link>
          {pageTitle && (
            <div className="hidden lg:block border-l border-border pl-4">
              <h1 className="font-semibold text-foreground">{pageTitle}</h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <ThemeToggle />
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <User className="h-5 w-5" />
            </Button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function SidebarNav({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  );
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] =
    React.useState<SidebarNotificationCounts>({
      pendingEstimates: 0,
      overdueJobs: 0,
      newLeads: 0,
      lowInventoryItems: 0,
    });
  const [performance, setPerformance] = React.useState<SidebarPerformanceData>({
    todayJobsCount: 0,
    todayJobsScheduled: 0,
    weekRevenue: 0,
    weekRevenueTarget: 5000,
    outstandingInvoices: 0,
    outstandingInvoicesAmount: 0,
  });

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('sidebar-collapsed-groups');
    if (stored) {
      try {
        setCollapsedGroups(new Set(JSON.parse(stored)));
        return;
      } catch {
        // fallthrough
      }
    }
    const initialCollapsed = new Set<string>();
    navigationGroups.forEach((group) => {
      if (!group.defaultOpen) initialCollapsed.add(group.name);
    });
    setCollapsedGroups(initialCollapsed);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(
      'sidebar-collapsed-groups',
      JSON.stringify(Array.from(collapsedGroups))
    );
  }, [collapsedGroups]);

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [notifRes, perfRes] = await Promise.all([
          fetch('/api/sidebar/notifications'),
          fetch('/api/sidebar/performance'),
        ]);
        if (notifRes.ok) setNotifications(await notifRes.json());
        if (perfRes.ok) setPerformance(await perfRes.json());
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toUpperCase();
        navigationGroups.forEach((group) => {
          group.items.forEach((item) => {
            if (item.shortcut === key) {
              e.preventDefault();
              router.push(item.href);
              onClose();
            }
          });
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, onClose]);

  const toggleGroup = (groupName: string): void => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getProgressPercentage = (): number =>
    performance.weekRevenueTarget === 0
      ? 0
      : Math.min(
          (performance.weekRevenue / performance.weekRevenueTarget) * 100,
          100
        );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed lg:sticky inset-y-0 left-0 z-50 w-64 bg-card border-r border-border',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:shadow-none shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 h-14 lg:h-16 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <img
                src="/dovetails-logo.png"
                alt="Dovetails"
                className="w-6 h-6 object-contain"
              />
            </div>
            <h1 className="font-bold text-lg text-foreground">DovePro</h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {navigationGroups.map((group) => {
              const isCollapsed = mounted
                ? collapsedGroups.has(group.name)
                : !group.defaultOpen;
              return (
                <div key={group.name} className="space-y-1">
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full"
                    onClick={() => toggleGroup(group.name)}
                    aria-expanded={!isCollapsed}
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
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group',
                              isActive
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                            onClick={onClose}
                            title={
                              item.shortcut
                                ? `${item.name} (Alt+${item.shortcut})`
                                : item.name
                            }
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5 flex-shrink-0 transition-colors',
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
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
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
              </div>
              {performance.outstandingInvoices > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Outstanding
                  </span>
                  <span className="font-semibold text-amber-600">
                    {formatCurrency(performance.outstandingInvoicesAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppShell({ children, className }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [pageTitle, setPageTitle] = React.useState<string | undefined>();

  const contextValue = React.useMemo(
    () => ({ isSidebarOpen, setIsSidebarOpen, pageTitle, setPageTitle }),
    [isSidebarOpen, pageTitle]
  );

  return (
    <HeaderContext.Provider value={contextValue}>
      <div className={cn('flex h-screen bg-background', className)}>
        <div className="hidden lg:block">
          <SidebarNav isOpen={true} onClose={() => setIsSidebarOpen(false)} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <div className="lg:hidden">
            <SidebarNav
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
          <main className="flex-1 overflow-auto">
            <div className="min-h-full px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HeaderContext.Provider>
  );
}

AppShell.displayName = 'AppShell';

export { AppShell, useHeader };
