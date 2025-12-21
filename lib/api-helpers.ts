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
 * Database error codes from Supabase/PostgreSQL
 */
export enum DatabaseErrorCode {
  NOT_FOUND = 'PGRST116',
  FOREIGN_KEY_VIOLATION = '23503',
  UNIQUE_VIOLATION = '23505',
  CHECK_VIOLATION = '23514',
  PERMISSION_DENIED = 'PGRST200',
  INVALID_TEXT = '22P02',
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

  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as {
      code: string;
      message?: string;
      details?: string;
    };

    // Map database errors to user-friendly messages
    switch (dbError.code) {
      case DatabaseErrorCode.NOT_FOUND:
        return Response.json({ error: 'Resource not found' }, { status: 404 });
      case DatabaseErrorCode.FOREIGN_KEY_VIOLATION:
        return Response.json(
          {
            error:
              'Cannot delete resource because it is referenced by other records',
          },
          { status: 409 }
        );
      case DatabaseErrorCode.UNIQUE_VIOLATION:
        return Response.json(
          {
            error: 'A record with this information already exists',
          },
          { status: 409 }
        );
      case DatabaseErrorCode.PERMISSION_DENIED:
        return Response.json({ error: 'Permission denied' }, { status: 403 });
    }
  }

  const message =
    error instanceof Error && process.env.NODE_ENV === 'development'
      ? error.message
      : defaultMessage;

  const response: any = { error: message };

  // Include error code in development for debugging
  if (
    process.env.NODE_ENV === 'development' &&
    error &&
    typeof error === 'object'
  ) {
    if ('code' in error) response.code = (error as any).code;
    if ('details' in error) response.details = (error as any).details;
  }

  return Response.json(response, { status });
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

/**
 * Validation error response (400)
 */
export function validationErrorResponse(
  errors: Record<string, string[]> | string
) {
  return Response.json(
    {
      error: 'Validation failed',
      details: typeof errors === 'string' ? errors : errors,
    },
    { status: 400 }
  );
}

/**
 * Not found response (404)
 */
export function notFoundResponse(resource: string = 'Resource') {
  return Response.json({ error: `${resource} not found` }, { status: 404 });
}

/**
 * Conflict response (409)
 */
export function conflictResponse(message: string = 'Resource already exists') {
  return Response.json({ error: message }, { status: 409 });
}

/**
 * Rate limit exceeded response (429)
 */
export function rateLimitResponse(retryAfter?: number) {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers }
  );
}
