'use client';

import { PortalSidebar } from '@/components/ui/portal-sidebar';
import { Calendar, Briefcase, User, CalendarDays } from 'lucide-react';

interface TechPortalSidebarProps {
  userName: string;
  userRole: string;
}

export function TechPortalSidebar({
  userName,
  userRole,
}: TechPortalSidebarProps) {
  return (
    <PortalSidebar
      branding={{
        name: 'Tech Portal',
        description: 'Field Technician',
        logoLetter: 'T',
        logoColor: 'bg-green-600',
      }}
      navigationGroups={[
        {
          name: 'Daily Work',
          defaultOpen: true,
          items: [
            {
              name: 'Today',
              href: '/tech/today',
              icon: <Calendar className="h-5 w-5" />,
              shortcut: 'T',
            },
            {
              name: 'My Jobs',
              href: '/tech/my-jobs',
              icon: <Briefcase className="h-5 w-5" />,
              shortcut: 'J',
            },
            {
              name: 'Schedule',
              href: '/admin/schedule',
              icon: <CalendarDays className="h-5 w-5" />,
              shortcut: 'S',
            },
          ],
        },
        {
          name: 'Profile',
          defaultOpen: true,
          items: [
            {
              name: 'My Profile',
              href: '/tech/profile',
              icon: <User className="h-5 w-5" />,
              shortcut: 'P',
            },
          ],
        },
      ]}
      userInfo={{
        name: userName,
        role: userRole === 'TECH' ? 'Technician' : userRole,
        showOnlineStatus: true,
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
