import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddLead } from '@/components/quick-add-lead';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { requirePortalAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalAccess('admin');
  return (
    <ToastProvider>
      <CommandPalette />
      <QuickAddLead />
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Jobber-style main content area */}
          <div className="min-h-full">
            <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
