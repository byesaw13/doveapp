import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { canManageAdmin } from '@/lib/auth-guards';

export default async function AdminLayout({
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

  // For now, we'll assume the user has admin access
  // In production, you'd check account membership here
  const hasAdminAccess = true; // TODO: Implement proper role checking

  if (!hasAdminAccess) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header - Housecall Pro Style */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">
                A
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Admin Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Field Service Management
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Account:{' '}
              <span className="font-medium text-foreground">Demo Account</span>{' '}
              | Role: <span className="font-medium text-primary">ADMIN</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar - Housecall Pro Style */}
        <aside className="w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            <a
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📊 Dashboard
            </a>
            <a
              href="/admin/schedule"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              📅 Schedule
            </a>
            <a
              href="/admin/jobs"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              🔧 Jobs
            </a>
            <a
              href="/admin/customers"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              👥 Customers
            </a>
            <a
              href="/admin/team"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              👷 Team
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
