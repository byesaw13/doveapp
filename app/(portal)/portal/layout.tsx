import { CustomerPortalSidebar } from './CustomerPortalSidebar';
import { requirePortalAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requirePortalAccess('customer');

  return (
    <div className="flex h-screen bg-background">
      <CustomerPortalSidebar
        userName={context.user.full_name || context.user.email || 'Customer'}
      />
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
