'use client';
// Client-only. Do not import from Server Components or server utilities.

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * @deprecated This factory is retained for advanced or legacy usage.
 * Prefer importing `supabase` from lib/supabase.ts for normal UI usage.
 */

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
