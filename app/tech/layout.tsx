import Link from 'next/link';
import { TechLogoutButton } from '@/components/tech-logout-button';
import { TechPortalSidebar } from './TechPortalSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { requirePortalAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requirePortalAccess('tech');

  return (
    <div className="min-h-screen bg-background">
      {/* Tech Header - Mobile-first */}
      <header className="border-b border-border bg-card lg:hidden">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Field Tech</h1>
              <p className="text-xs text-muted-foreground">
                {context.user.full_name || context.user.email}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Online
            </div>
            <TechLogoutButton />
          </div>
        </div>
      </header>

      {/* Desktop Layout with Unified Sidebar */}
      <div className="hidden lg:flex h-screen">
        <TechPortalSidebar
          userName={
            context.user.full_name || context.user.email || 'Technician'
          }
          userRole={context.role}
        />
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="min-h-full">
            <div className="px-4 py-6 lg:px-8 lg:py-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Layout with Bottom Navigation */}
      <div className="lg:hidden">
        <main className="pb-20">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden z-50">
          <div className="flex">
            <Link
              href="/tech/today"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">📅</span>
              Today
            </Link>
            <Link
              href="/tech/jobs"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">📋</span>
              Jobs
            </Link>
            <Link
              href="/tech/schedule"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">🗓️</span>
              Schedule
            </Link>
            <Link
              href="/tech/profile"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">👤</span>
              Profile
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
