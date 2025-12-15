import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Client-side Supabase client with proper cookie handling for SSR
 * This ensures auth sessions persist across page reloads
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
