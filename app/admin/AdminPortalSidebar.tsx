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
  Search,
  Clock,
  FileCheck,
  Bell,
  HelpCircle,
  Bug,
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
            {
              name: 'Business Intelligence',
              href: '/admin/business-intelligence',
              icon: <BarChart3 className="h-5 w-5" />,
              shortcut: 'B',
            },
            {
              name: 'Advanced Analytics',
              href: '/admin/advanced-analytics',
              icon: <BarChart3 className="h-5 w-5" />,
              shortcut: 'A',
            },
            {
              name: 'Customer Analytics',
              href: '/admin/analytics/customers',
              icon: <BarChart3 className="h-5 w-5" />,
              shortcut: 'C',
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
              name: 'Customers',
              href: '/admin/customers',
              icon: <UserCog className="h-5 w-5" />,
              shortcut: 'U',
            },
            {
              name: 'Profile Requests',
              href: '/admin/profile-change-requests',
              icon: <UserCog className="h-5 w-5" />,
              shortcut: 'P',
            },
            {
              name: 'Calendar',
              href: '/admin/calendar',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'C',
            },
            {
              name: 'Portal Customers',
              href: '/admin/portal-customers',
              icon: <UserCog className="h-5 w-5" />,
              shortcut: 'U',
            },
            {
              name: 'Jobs',
              href: '/admin/jobs',
              icon: <Briefcase className="h-5 w-5" />,
              badge: 'overdueJobs',
              shortcut: 'J',
            },
            {
              name: 'Schedule',
              href: '/admin/schedule',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'H',
            },
            {
              name: 'Advanced Search',
              href: '/admin/search',
              icon: <Search className="h-5 w-5" />,
              shortcut: 'S',
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
            {
              name: 'Advanced Automation',
              href: '/admin/advanced-automation',
              icon: <Zap className="h-5 w-5" />,
              shortcut: 'V',
            },
            {
              name: 'Job Templates',
              href: '/admin/job-templates',
              icon: <FileCheck className="h-5 w-5" />,
              shortcut: 'T',
            },
            {
              name: 'Job Workflows',
              href: '/admin/job-workflows',
              icon: <FileCheck className="h-5 w-5" />,
              shortcut: 'W',
            },
            {
              name: 'Time Tracking',
              href: '/admin/time-tracking',
              icon: <Clock className="h-5 w-5" />,
              shortcut: 'M',
            },
            {
              name: 'Pricebook Inspector',
              href: '/admin/pricebook/inspector',
              icon: <FileText className="h-5 w-5" />,
              shortcut: 'P',
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
          defaultOpen: true,
          items: [
            {
              name: 'Emails',
              href: '/admin/emails',
              icon: <Mail className="h-5 w-5" />,
              shortcut: 'M',
            },
            {
              name: 'Email Templates',
              href: '/admin/email-templates',
              icon: <Mail className="h-5 w-5" />,
              shortcut: 'E',
            },
            {
              name: 'Invoice Reminders',
              href: '/admin/invoice-reminders',
              icon: <Bell className="h-5 w-5" />,
              shortcut: 'R',
            },
            {
              name: 'Team',
              href: '/admin/team',
              icon: <UserCog className="h-5 w-5" />,
              shortcut: 'T',
            },
            {
              name: 'Team Scheduling',
              href: '/admin/team/scheduling',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'S',
            },
            {
              name: 'Security & Compliance',
              href: '/admin/security-compliance',
              icon: <Shield className="h-5 w-5" />,
              shortcut: 'C',
            },
            {
              name: 'Help & Support',
              href: '/admin/help',
              icon: <HelpCircle className="h-5 w-5" />,
              shortcut: 'H',
            },
            {
              name: 'Debug Tools',
              href: '/admin/debug',
              icon: <Bug className="h-5 w-5" />,
              shortcut: 'D',
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
