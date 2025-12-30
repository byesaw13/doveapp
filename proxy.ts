import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { DEMO_ACCOUNT_ID, isDemoMode } from '@/lib/auth/demo';

/**
 * Enhanced proxy with authentication and account context validation.
 * Uses a single NextResponse and forwards account context via request headers.
 */
export async function proxy(request: NextRequest) {
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
    const pathname = request.nextUrl.pathname;
    // Check if user exists in users table (making them a customer)
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    const isCustomer = !!userProfile;
    const isPortalRoute =
      pathname.startsWith('/portal') || pathname.startsWith('/api/portal');

    if (isDemoMode()) {
      const demoRole = isPortalRoute ? 'CUSTOMER' : 'OWNER';
      requestHeaders.set('x-user-role', demoRole);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-account-id', DEMO_ACCOUNT_ID);
      return applyCookies(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      );
    }

    // Allow customers to access portal routes
    if (isPortalRoute && isCustomer) {
      // Find customer record to get account_id
      const { data: customer } = await supabase
        .from('customers')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      const accountId =
        customer?.account_id || (isDemoMode() ? DEMO_ACCOUNT_ID : null);

      if (!accountId) {
        return applyCookies(
          NextResponse.redirect(
            new URL('/auth/login?error=no_account', request.url)
          )
        );
      }

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
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tech') ||
      pathname.startsWith('/portal')
    ) {
      return applyCookies(
        NextResponse.redirect(
          new URL('/auth/login?error=no_account', request.url)
        )
      );
    }

    if (pathname.startsWith('/api/')) {
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

    const isPortalUi = pathname.startsWith('/portal');
    const isPortalApi = pathname.startsWith('/api/portal');
    if (isPortalUi || isPortalApi) {
      if (primaryMembership.role !== 'CUSTOMER') {
        return applyCookies(
          isPortalApi
            ? NextResponse.json(
                { error: 'Customer access required' },
                { status: 403 }
              )
            : NextResponse.redirect(
                new URL(
                  '/auth/login?error=insufficient_permissions',
                  request.url
                )
              )
        );
      }
    }
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
