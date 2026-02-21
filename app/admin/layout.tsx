import { AppShell } from '@/components/ui/app-shell';
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
      <AppShell>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppShell>
    </ToastProvider>
  );
}
