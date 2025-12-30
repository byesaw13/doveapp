'use client';
// Client-only. Do not import from Server Components or server utilities.

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * @deprecated This factory is retained for compatibility and legacy usage.
 * Prefer importing `supabase` from lib/supabase.ts for normal UI usage.
 * This file exists to maintain existing imports without breaking changes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
