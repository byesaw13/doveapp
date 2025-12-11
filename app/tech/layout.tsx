import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // For now, we'll assume the user has tech access
  // In production, you'd check account membership here
  const hasTechAccess = true; // TODO: Implement proper role checking

  if (!hasTechAccess) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tech Header - Mobile-first like Housecall Pro */}
      <header className="border-b border-border bg-card lg:hidden">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                T
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Field Tech</h1>
              <p className="text-xs text-muted-foreground">Mike Johnson</p>
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <aside className="w-64 border-r border-border bg-card min-h-screen">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  T
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mike Johnson</h2>
                <p className="text-xs text-muted-foreground">
                  Senior Technician
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-xs text-accent">Online</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <a
              href="/tech/today"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📅 Today
            </a>
            <a
              href="/tech/jobs"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📋 My Jobs
            </a>
            <a
              href="/tech/schedule"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              🗓️ Schedule
            </a>
            <a
              href="/tech/profile"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              👤 Profile
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-muted/20">{children}</main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <main className="pb-20">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden">
          <div className="flex">
            <a
              href="/tech/today"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">📅</span>
              Today
            </a>
            <a
              href="/tech/jobs"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">📋</span>
              Jobs
            </a>
            <a
              href="/tech/schedule"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">🗓️</span>
              Schedule
            </a>
            <a
              href="/tech/profile"
              className="flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg mb-1">👤</span>
              Profile
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
