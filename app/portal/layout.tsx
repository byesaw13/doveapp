import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function PortalLayout({
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

  // For customer portal, we might allow both registered users and magic-link access
  // For now, we'll assume authenticated users can access
  const hasPortalAccess = true; // TODO: Implement proper customer validation

  if (!hasPortalAccess) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Customer Portal Header - Clean and minimal */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">
                P
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Customer Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Your Service Dashboard
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome back, John Smith
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Customer Portal Sidebar - Simple and focused */}
        <aside className="w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            <a
              href="/portal/home"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              🏠 Home
            </a>
            <a
              href="/portal/upcoming"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📅 Upcoming
            </a>
            <a
              href="/portal/history"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📚 History
            </a>
            <a
              href="/portal/estimates"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📋 Estimates
            </a>
            <a
              href="/portal/invoices"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              💰 Invoices
            </a>
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-border mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                🚨 Emergency Service
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors">
                📞 Contact Us
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
