import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { listTodayVisits, type VisitFilters } from '@/lib/api/visits';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    const filters: VisitFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      date: searchParams.get('date') || undefined,
    };

    const { data, page, pageSize, total, error } = await listTodayVisits(
      {
        accountId: context.accountId,
        userId: context.userId,
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], page, pageSize, total });
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('required') || error.message?.includes('access');
    if (!isAuthError) {
      console.error('Error in GET /api/tech/today-visits:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
