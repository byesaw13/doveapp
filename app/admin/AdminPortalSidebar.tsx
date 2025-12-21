'use client';

import { PortalSidebar } from '@/components/ui/portal-sidebar';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Package,
  BarChart3,
  FileText,
  Settings,
  Home,
  Zap,
  UserCog,
  Mail,
  Brain,
  Shield,
} from 'lucide-react';

interface AdminPortalSidebarProps {
  userName: string;
  userRole: string;
  accountName: string;
}

export function AdminPortalSidebar({
  userName,
  userRole,
  accountName,
}: AdminPortalSidebarProps) {
  return (
    <PortalSidebar
      branding={{
        name: 'Admin Portal',
        description: 'Field Service Management',
        logoLetter: 'A',
      }}
      navigationGroups={[
        {
          name: 'Business Overview',
          defaultOpen: true,
          items: [
            {
              name: 'Dashboard',
              href: '/admin/dashboard',
              icon: <LayoutDashboard className="h-5 w-5" />,
              shortcut: 'D',
            },
            {
              name: 'KPI Analytics',
              href: '/admin/kpi',
              icon: <BarChart3 className="h-5 w-5" />,
              shortcut: 'K',
            },
          ],
        },
        {
          name: 'Sales & Opportunities',
          defaultOpen: true,
          items: [
            {
              name: 'Leads',
              href: '/admin/leads',
              icon: <Users className="h-5 w-5" />,
              badge: 'newLeads',
              shortcut: 'L',
            },
            {
              name: 'Estimates',
              href: '/admin/estimates',
              icon: <FileText className="h-5 w-5" />,
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
              name: 'Today',
              href: '/admin/today',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'T',
            },
            {
              name: 'Calendar',
              href: '/admin/calendar',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'C',
            },
            {
              name: 'Jobs',
              href: '/admin/jobs',
              icon: <Briefcase className="h-5 w-5" />,
              badge: 'overdueJobs',
              shortcut: 'J',
            },
          ],
        },
        {
          name: 'Relationships',
          defaultOpen: true,
          items: [
            {
              name: 'Clients',
              href: '/admin/customers',
              icon: <Users className="h-5 w-5" />,
              shortcut: 'U',
            },
            {
              name: 'Properties',
              href: '/admin/properties',
              icon: <Home className="h-5 w-5" />,
              shortcut: 'P',
            },
          ],
        },
        {
          name: 'Resources',
          defaultOpen: false,
          items: [
            {
              name: 'Inventory',
              href: '/admin/inventory',
              icon: <Package className="h-5 w-5" />,
              badge: 'lowInventoryItems',
              shortcut: 'I',
            },
            {
              name: 'Automations',
              href: '/admin/automations',
              icon: <Zap className="h-5 w-5" />,
              shortcut: 'A',
            },
          ],
        },
        {
          name: 'Settings',
          defaultOpen: false,
          items: [
            {
              name: 'Basic Settings',
              href: '/admin/settings',
              icon: <Settings className="h-5 w-5" />,
              shortcut: 'S',
            },
            {
              name: 'Advanced Settings',
              href: '/admin/advanced-settings',
              icon: <Settings className="h-5 w-5" />,
              shortcut: 'A',
            },
            {
              name: 'AI Estimator',
              href: '/admin/settings/ai-estimator',
              icon: <Brain className="h-5 w-5" />,
              shortcut: 'I',
            },
          ],
        },
        {
          name: 'Administration',
          defaultOpen: false,
          items: [
            {
              name: 'Emails',
              href: '/admin/emails',
              icon: <Mail className="h-5 w-5" />,
              shortcut: 'M',
            },
            {
              name: 'Team',
              href: '/admin/team',
              icon: <UserCog className="h-5 w-5" />,
              shortcut: 'T',
            },
            {
              name: 'Security & Compliance',
              href: '/admin/security-compliance',
              icon: <Shield className="h-5 w-5" />,
              shortcut: 'S',
            },
          ],
        },
      ]}
      quickActions={[
        {
          label: 'Job',
          icon: <Briefcase className="h-4 w-4" />,
          href: '/admin/jobs?new=true',
        },
        {
          label: 'Client',
          icon: <Users className="h-4 w-4" />,
          href: '/admin/customers?new=true',
        },
        {
          label: 'Estimate',
          icon: <FileText className="h-4 w-4" />,
          href: '/admin/estimates?new=true',
        },
      ]}
      userInfo={{
        name: userName,
        role: userRole,
        accountName: accountName,
      }}
      showPerformanceWidget={true}
      showNotifications={true}
      showThemeToggle={true}
      showKeyboardShortcuts={true}
      onLogout={() => {
        window.location.href = '/auth/login';
      }}
    />
  );
}
