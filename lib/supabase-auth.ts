import { createServerClient } from '@/lib/supabase/server';
import {
  getAccountContextFromHeaders,
  hydrateAccountContext,
} from '@/lib/auth/account-context';

/**
 * @deprecated Prefer createRouteHandlerClient in route handlers.
 * Use createServerClient from lib/supabase/server for server components.
 */
export async function createAuthClient() {
  return createServerClient();
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
  try {
    const baseContext = await getAccountContextFromHeaders();
    return await hydrateAccountContext(baseContext, supabase);
  } catch (_error) {
    return null;
  }
}
