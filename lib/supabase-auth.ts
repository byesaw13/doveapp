import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side operations
 * This client uses the user's session and respects RLS policies
 *
 * IMPORTANT: Use this instead of lib/supabase-server.ts for authenticated operations
 * The service role client should ONLY be used for admin operations that bypass RLS
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current user's account context
 * Returns the first active membership
 */
export async function getCurrentAccountContext() {
  const supabase = await createAuthClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select(
      `
      account_id,
      role,
      is_active,
      accounts (
        id,
        name,
        subdomain,
        custom_domain,
        logo_url,
        brand_primary_color,
        brand_secondary_color
      ),
      users (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    accountId: membership.account_id,
    role: membership.role as 'OWNER' | 'ADMIN' | 'TECH',
    account: membership.accounts as any,
    user: membership.users as any,
  };
}
