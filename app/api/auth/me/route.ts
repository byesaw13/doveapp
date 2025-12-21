import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';

/**
 * GET /api/auth/me - Get current authenticated user info for portal
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireCustomerContext(request);

    return NextResponse.json({
      user: {
        id: context.userId,
        role: context.role,
        accountId: context.accountId,
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
