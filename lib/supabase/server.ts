import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

// For Server Components and server-only helpers. Use createRouteHandlerClient in route handlers.
export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...(options || {}) });
          } catch (error) {
            // Ignore when cookies are read-only (e.g. Server Components).
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...(options || {}), maxAge: 0 });
          } catch (error) {
            // Ignore when cookies are read-only (e.g. Server Components).
          }
        },
      },
    }
  );
}

// Alias for backward compatibility
export const createClient = createServerClient;
