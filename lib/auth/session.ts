import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { DEFAULT_ROLE_PERMISSIONS, type Permission } from '../auth-guards';
import type { Role } from './roles';

export interface AccountContext {
  accountId: string;
  userId: string;
  role: Role;
  permissions: Permission[];
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  account: {
    id: string;
    name: string;
    subdomain?: string;
    custom_domain?: string;
    logo_url?: string;
  };
}

export async function getServerSessionOrNull(): Promise<AccountContext | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  // Fetch membership
  const { data: membership, error: membershipError } = await supabase
    .from('account_memberships')
    .select('role, is_active, account_id, user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('Membership query result:', {
    membership,
    membershipError,
    userId: user.id,
  });

  let accountId: string;
  let role: Role;
  let permissions: Permission[];
  let account: any;
  let userDetails: any;

  if (membershipError || !membership) {
    // For users without membership, assign customer role
    accountId = '6785bba1-553c-4886-9638-460033ad6b01';
    role = 'CUSTOMER';
    permissions = [];
    account = {
      id: accountId,
      name: 'Dovetails Services LLC',
      subdomain: null,
      custom_domain: null,
      logo_url: null,
    };
    userDetails = {
      id: user.id,
      email: user.email || '',
      full_name: null,
      avatar_url: null,
    };
  } else {
    accountId = (membership as any).account_id;
    const userRole = membership.role as 'OWNER' | 'ADMIN' | 'TECH';
    role = userRole as Role;
    // No custom permissions column - always use defaults
    permissions = DEFAULT_ROLE_PERMISSIONS[userRole];

    // Fetch account and user details separately
    const { data: accountData } = await supabase
      .from('accounts')
      .select('id, name, subdomain, custom_domain, logo_url')
      .eq('id', accountId)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    account = accountData || {
      id: accountId,
      name: 'Unknown Account',
      subdomain: null,
      custom_domain: null,
      logo_url: null,
    };
    userDetails = userData || {
      id: user.id,
      email: user.email || '',
      full_name: null,
      avatar_url: null,
    };
  }

  return {
    accountId,
    userId: user.id,
    role,
    permissions,
    user: userDetails,
    account,
  };
}

export async function requireUser(): Promise<AccountContext> {
  const session = await getServerSessionOrNull();
  console.log('requireUser session:', session);
  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }
  return session!;
}
