'use client';

import { PortalSidebar } from '@/components/ui/portal-sidebar';
import {
  Home,
  Calendar,
  History,
  FileText,
  DollarSign,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface CustomerPortalSidebarProps {
  userName: string;
}

export function CustomerPortalSidebar({
  userName,
}: CustomerPortalSidebarProps) {
  return (
    <PortalSidebar
      branding={{
        name: 'Customer Portal',
        description: 'Your Service Dashboard',
        logoLetter: 'P',
      }}
      navigationGroups={[
        {
          name: 'My Services',
          defaultOpen: true,
          items: [
            {
              name: 'Home',
              href: '/portal/home',
              icon: <Home className="h-5 w-5" />,
              shortcut: 'H',
            },
            {
              name: 'Upcoming',
              href: '/portal/upcoming',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'U',
            },
            {
              name: 'History',
              href: '/portal/history',
              icon: <History className="h-5 w-5" />,
              shortcut: 'Y',
            },
          ],
        },
        {
          name: 'Billing & Quotes',
          defaultOpen: true,
          items: [
            {
              name: 'Estimates',
              href: '/portal/estimates',
              icon: <FileText className="h-5 w-5" />,
              shortcut: 'E',
            },
            {
              name: 'Invoices',
              href: '/portal/invoices',
              icon: <DollarSign className="h-5 w-5" />,
              shortcut: 'I',
            },
          ],
        },
      ]}
      quickActions={[
        {
          label: 'Emergency',
          icon: <AlertCircle className="h-4 w-4" />,
          onClick: () => {
            alert('Emergency service request feature coming soon!');
          },
        },
        {
          label: 'Contact',
          icon: <Phone className="h-4 w-4" />,
          onClick: () => {
            alert('Contact us feature coming soon!');
          },
        },
      ]}
      userInfo={{
        name: userName,
      }}
      showPerformanceWidget={false}
      showNotifications={false}
      showThemeToggle={true}
      showKeyboardShortcuts={true}
      onLogout={() => {
        window.location.href = '/auth/login';
      }}
    />
  );
}
