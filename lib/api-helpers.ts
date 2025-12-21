import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Create authenticated Supabase client from request
 * Uses user's session cookies to enforce RLS
 */
export function createAuthenticatedClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/**
 * Create Supabase admin client with service role key
 * BYPASSES RLS - use only for admin operations
 * Should only be called after validating admin permissions
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Standardized error response
 * Prevents information leakage in production
 */
export function errorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  status: number = 500
) {
  console.error('API Error:', error);

  const message =
    error instanceof Error && process.env.NODE_ENV === 'development'
      ? error.message
      : defaultMessage;

  return Response.json({ error: message }, { status });
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

/**
 * Success response with data
 */
export function successResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}
