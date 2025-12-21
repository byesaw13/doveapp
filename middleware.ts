import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Enhanced middleware with authentication and account context validation.
 * Uses a single NextResponse and forwards account context via request headers.
 */
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pendingCookies: Array<{
    name: string;
    value: string;
    options?: any;
  }> = [];

  const applyCookies = (response: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set({ name, value, ...(options || {}) });
    }
    return response;
  };

  // Create Supabase client for server-side auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          pendingCookies.push({ name, value, options });
        },
        remove(name: string, options: any) {
          pendingCookies.push({ name, value: '', options });
        },
      },
    }
  );

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Redirect to login for protected routes
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/tech') ||
      request.nextUrl.pathname.startsWith('/portal')
    ) {
      return applyCookies(
        NextResponse.redirect(new URL('/auth/login', request.url))
      );
    }

    // Return 401 for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return applyCookies(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      );
    }

    return applyCookies(NextResponse.next());
  }

  // Get user's account memberships to determine account context
  const { data: memberships } = await supabase
    .from('account_memberships')
    .select('account_id, role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!memberships || memberships.length === 0) {
    // Check if user exists in users table (making them a customer)
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    const isCustomer = !!userProfile;

    // Allow customers to access portal routes
    if (request.nextUrl.pathname.startsWith('/portal') && isCustomer) {
      // Find customer record to get account_id
      const { data: customer } = await supabase
        .from('customers')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      const accountId =
        customer?.account_id || '6785bba1-553c-4886-9638-460033ad6b01'; // Default to Dovetails Services LLC

      // Add customer context for portal routes
      requestHeaders.set('x-user-role', 'CUSTOMER');
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-account-id', accountId);
      return applyCookies(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      );
    }

    // Redirect non-customers without memberships
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/tech') ||
      request.nextUrl.pathname.startsWith('/portal')
    ) {
      return applyCookies(
        NextResponse.redirect(
          new URL('/auth/login?error=no_account', request.url)
        )
      );
    }

    if (request.nextUrl.pathname.startsWith('/api/')) {
      return applyCookies(
        NextResponse.json(
          { error: 'No account membership found' },
          { status: 403 }
        )
      );
    }
  }

  // For now, use the first active membership
  // TODO: Implement account switching logic
  const primaryMembership = memberships?.[0];

  if (primaryMembership) {
    // Add account context to request headers for downstream API routes
    requestHeaders.set('x-account-id', primaryMembership.account_id);
    requestHeaders.set('x-user-role', primaryMembership.role);
    requestHeaders.set('x-user-id', user.id);

    // Role-based access control for portal routes
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/admin')) {
      if (
        primaryMembership.role !== 'OWNER' &&
        primaryMembership.role !== 'ADMIN'
      ) {
        return applyCookies(
          NextResponse.redirect(
            new URL('/auth/login?error=insufficient_permissions', request.url)
          )
        );
      }
    }

    if (pathname.startsWith('/tech')) {
      if (
        primaryMembership.role !== 'OWNER' &&
        primaryMembership.role !== 'ADMIN' &&
        primaryMembership.role !== 'TECH'
      ) {
        return applyCookies(
          NextResponse.redirect(
            new URL('/auth/login?error=insufficient_permissions', request.url)
          )
        );
      }
    }

    // Portal route is accessible to customers (users with user_id linked)
    // This will be validated in the layout
  }

  return applyCookies(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  );
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tech/:path*',
    '/portal/:path*',
    '/api/admin/:path*',
    '/api/clients/:path*',
    '/api/jobs/:path*',
    '/api/estimates/:path*',
    '/api/invoices/:path*',
    '/api/leads/:path*',
    '/api/kpi/:path*',
    '/api/dashboard/:path*',
    '/api/materials/:path*',
    '/api/time-tracking/:path*',
    '/api/automation/:path*',
    '/api/automations/:path*',
    '/api/settings/:path*',
    '/api/tech/:path*',
    '/api/portal/:path*',
  ],
};
