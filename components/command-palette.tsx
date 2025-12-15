'use client';

// Command Palette Component - Updated to remove Mail import
// Version: 1.1 - Force cache reload

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Package,
  Clock,
  BarChart3,
  Target,
  FileText,
  Plus,
  Search,
} from 'lucide-react';

interface CommandItem {
  label: string;
  icon: any;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Toggle command palette with Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const navigationCommands: CommandItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () => navigate('/admin/dashboard'),
      keywords: ['home', 'overview'],
    },
    {
      label: 'KPI',
      icon: BarChart3,
      action: () => navigate('/admin/kpi'),
      keywords: ['metrics', 'analytics', 'stats'],
    },
    {
      label: 'Calendar',
      icon: Calendar,
      action: () => navigate('/admin/schedule'),
      keywords: ['schedule', 'appointments'],
    },
    {
      label: 'Leads',
      icon: Target,
      action: () => navigate('/admin/leads'),
      keywords: ['prospects', 'opportunities'],
    },
    {
      label: 'Estimates',
      icon: FileText,
      action: () => navigate('/admin/estimates'),
      keywords: ['quotes', 'proposals'],
    },
    {
      label: 'Jobs',
      icon: Briefcase,
      action: () => navigate('/admin/jobs'),
      keywords: ['work orders', 'projects'],
    },
    {
      label: 'Time Tracking',
      icon: Clock,
      action: () => navigate('/admin/time-tracking'),
      keywords: ['hours', 'timesheet'],
    },
    {
      label: 'Clients',
      icon: Users,
      action: () => navigate('/admin/clients'),
      keywords: ['customers', 'contacts'],
    },

    {
      label: 'Inventory',
      icon: Package,
      action: () => navigate('/admin/inventory'),
      keywords: ['materials', 'stock', 'supplies'],
    },
  ];

  const actionCommands: CommandItem[] = [
    {
      label: 'New Job',
      icon: Plus,
      action: () => navigate('/admin/jobs/new'),
      keywords: ['create', 'add'],
    },
    {
      label: 'New Client',
      icon: Plus,
      action: () => navigate('/admin/clients?new=true'),
      keywords: ['create', 'add', 'customer'],
    },
    {
      label: 'New Estimate',
      icon: Plus,
      action: () => navigate('/admin/estimates?new=true'),
      keywords: ['create', 'add', 'quote'],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {actionCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
