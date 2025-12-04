'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MapPin,
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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'KPI', href: '/kpi', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Estimates', href: '/estimates', icon: FileText },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Email', href: '/emails', icon: Mail },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Properties', href: '/properties', icon: MapPin },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Inventory', href: '/inventory', icon: Package },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          {/* Navigation - Jobber style */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
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
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

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
