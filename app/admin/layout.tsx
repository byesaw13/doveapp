import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddLead } from '@/components/quick-add-lead';
import { ToastProvider } from '@/components/ui/toast';

export const dynamic = 'force-dynamic';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              {children}
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
