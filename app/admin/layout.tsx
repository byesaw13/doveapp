import { redirect } from 'next/navigation';
import {
  createAuthClient,
  getCurrentAccountContext,
} from '@/lib/supabase-auth';
import { ToastProvider } from '@/components/ui/toast';
import { AdminClockBanner } from '@/components/admin/AdminClockBanner';
import { AdminPortalSidebar } from './AdminPortalSidebar';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddLead } from '@/components/quick-add-lead';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get account context and validate admin access
  const context = await getCurrentAccountContext();

  if (!context) {
    redirect('/auth/login?error=no_account');
  }

  // Enforce admin/owner role
  if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions');
  }

  return (
    <ToastProvider>
      <CommandPalette />
      <QuickAddLead />
      <div className="flex h-screen bg-background">
        <AdminPortalSidebar
          userName={
            context.user.full_name || context.user.email || 'Admin User'
          }
          userRole={context.role}
          accountName={context.account.name}
        />
        <main className="flex-1 overflow-auto">
          {/* Admin Clock Banner */}
          <div className="border-b border-border bg-card px-6 py-3 sticky top-0 z-10">
            <AdminClockBanner
              technicianName={
                context.user.full_name || context.user.email || 'Admin User'
              }
            />
          </div>
          <div className="min-h-full">
            <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
