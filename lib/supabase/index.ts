'use client';
// Client-only. Do not import from Server Components or server utilities.
// This file exists only as a compatibility barrel.
// New code should import directly from lib/supabase.ts.
// Do not import from server code.

export { createServerClient } from './server';
export { createBrowserClient } from './browser';
export { createAdminClient } from './admin';
