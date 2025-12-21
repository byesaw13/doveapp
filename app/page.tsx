import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Root landing page - redirects to appropriate portal based on user role
 */
export default async function RootPage() {
  const cookieStore = await cookies();

  // Create Supabase client to check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Get user's role from account memberships
  const { data: memberships } = await supabase
    .from('account_memberships')
    .select('role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  // Check if user is a customer (has user record but no account membership)
  const { data: userProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  const isCustomer =
    !!userProfile && (!memberships || memberships.length === 0);

  if (isCustomer) {
    // Customer portal
    redirect('/portal/home');
  }

  if (memberships && memberships.length > 0) {
    const role = memberships[0].role;

    // Route based on role
    switch (role) {
      case 'OWNER':
      case 'ADMIN':
        redirect('/admin/dashboard');
      case 'TECH':
        redirect('/tech/today');
      default:
        redirect('/auth/login?error=invalid_role');
    }
  }

  // Fallback to login if no role found
  redirect('/auth/login?error=no_role');
}
