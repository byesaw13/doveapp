import { createServerClient } from '@/lib/supabase/server';
import type { AccountContext } from '@/lib/auth-guards';
import {
  getAccountContextFromHeaders,
  hydrateAccountContext,
} from '@/lib/auth/account-context';

export async function getServerSessionOrNull(): Promise<AccountContext | null> {
  try {
    const baseContext = await getAccountContextFromHeaders();
    const supabase = await createServerClient();
    return await hydrateAccountContext(baseContext, supabase);
  } catch (_error) {
    return null;
  }
}

export async function requireUser(): Promise<AccountContext> {
  const session = await getServerSessionOrNull();
  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }
  return session!;
}
