import { redirect } from 'next/navigation';
import { createAuthClient, getCurrentUser } from '@/lib/supabase-auth';
import { CustomerPortalSidebar } from './CustomerPortalSidebar';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthClient();

  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user profile for display
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex h-screen bg-background">
      <CustomerPortalSidebar
        userName={userProfile?.full_name || userProfile?.email || 'Customer'}
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
