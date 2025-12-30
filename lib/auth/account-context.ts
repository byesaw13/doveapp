import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_ROLE_PERMISSIONS,
  type AccountContext,
  type UserRole,
} from '@/lib/auth-guards';
import { DEMO_ACCOUNT_ID, isDemoMode } from './demo';

type HeaderSource = { get(name: string): string | null };

const VALID_ROLES: UserRole[] = ['OWNER', 'ADMIN', 'TECH', 'CUSTOMER'];

function resolveHeaderContext(source: HeaderSource): {
  accountId: string;
  userId: string;
  role: UserRole;
} {
  const roleHeader = source.get('x-user-role');
  const userId = source.get('x-user-id')?.trim();
  let accountId = source.get('x-account-id')?.trim();

  if (!userId || !roleHeader || !VALID_ROLES.includes(roleHeader as UserRole)) {
    throw new Error('Missing or invalid auth headers');
  }

  if (!accountId) {
    if (isDemoMode()) {
      accountId = DEMO_ACCOUNT_ID;
    } else {
      throw new Error('Missing account context');
    }
  }

  return { accountId, userId, role: roleHeader as UserRole };
}

export async function getAccountContextFromHeaders(
  request?: NextRequest
): Promise<AccountContext> {
  const source = request ? request.headers : await headers();
  const { accountId, userId, role } = resolveHeaderContext(source);

  return {
    accountId,
    userId,
    role,
    permissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
    user: {
      id: userId,
      email: '',
      full_name: null,
      avatar_url: null,
    },
    account: {
      id: accountId,
      name: '',
      subdomain: null,
      custom_domain: null,
      logo_url: null,
    },
  };
}

export async function hydrateAccountContext(
  baseContext: AccountContext,
  supabase: SupabaseClient
): Promise<AccountContext> {
  const [{ data: accountData }, { data: userData }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, subdomain, custom_domain, logo_url')
      .eq('id', baseContext.accountId)
      .maybeSingle(),
    supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', baseContext.userId)
      .maybeSingle(),
  ]);

  return {
    ...baseContext,
    account: accountData || {
      id: baseContext.accountId,
      name: 'Unknown Account',
      subdomain: null,
      custom_domain: null,
      logo_url: null,
    },
    user: userData || {
      id: baseContext.userId,
      email: '',
      full_name: null,
      avatar_url: null,
    },
  };
}
