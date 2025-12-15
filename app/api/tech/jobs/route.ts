import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { listJobs, type JobFilters } from '@/lib/api/jobs';

/**
 * GET /api/tech/jobs - List jobs assigned to the tech (read-only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    // For techs, always filter by assigned_tech_id
    const filters: JobFilters = {
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
      assignedTechId: context.userId, // Force filter by tech's user ID
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      sort: searchParams.get('sort') || 'created_at',
      dir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
    };

    const { data, page, pageSize, total, error } = await listJobs(
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
    console.error('Error in GET /api/tech/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
