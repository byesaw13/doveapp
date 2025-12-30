import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards-api';
import { listEstimates, type EstimateFilters } from '@/lib/api/estimates';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { isDemoMode } from '@/lib/auth/demo';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAdminContext(request);
      supabase = await createRouteHandlerClient();
    } catch (error) {
      if (!isDemoMode()) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // For demo purposes, allow access without account context
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Create a mock context for demo
      context = {
        accountId: 'demo',
        userId: 'demo-user',
        role: 'ADMIN' as const,
        permissions: [],
        user: { id: 'demo-user', email: 'demo@example.com' },
        account: { id: 'demo', name: 'Demo Account' },
      };
    }
    const { searchParams } = new URL(request.url);

    const filters: EstimateFilters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      sort: searchParams.get('sort') || 'created_at',
      dir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
    };

    const { data, page, pageSize, total, error } = await listEstimates(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], page, pageSize, total });
  } catch (error: any) {
    console.error('Error in GET /api/admin/estimates:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
