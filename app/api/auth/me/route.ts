import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';

/**
 * GET /api/auth/me - Get current authenticated user info for portal
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to get customer context, but allow demo access if no account
    let context;
    try {
      context = await requireCustomerContext(request);
    } catch (error) {
      // For demo purposes, allow access without customer context
      context = {
        userId: 'demo-customer',
        role: 'CUSTOMER' as const,
        accountId: 'demo-account',
        user: {
          id: 'demo-customer',
          email: 'demo@example.com',
          full_name: 'Demo Customer',
        },
        account: {
          id: 'demo-account',
          name: 'Demo Account',
        },
      };
    }

    return NextResponse.json({
      user: {
        id: context.userId,
        role: context.role,
        accountId: context.accountId,
        email: context.user?.email,
        full_name: context.user?.full_name,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/auth/me:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
