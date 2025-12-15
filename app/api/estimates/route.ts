import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';

// GET /api/estimates - Get all estimates or search
export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    let queryBuilder = supabase
      .from('estimates')
      .select(
        `
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account for multi-tenancy
    // Temporarily allowing estimates without account_id (legacy data)
    // In production: queryBuilder = queryBuilder.eq('account_id', context.accountId);

    if (action === 'expired') {
      const now = new Date();
      queryBuilder = queryBuilder
        .lt('valid_until', now.toISOString())
        .eq('status', 'pending');
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `estimate_number.ilike.%${query}%,notes.ilike.%${query}%`
      );
    }

    const { data: estimates, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching estimates:', error);
      return errorResponse(error, 'Failed to fetch estimates');
    }

    // Calculate stats if requested
    if (action === 'stats') {
      const stats = {
        total: estimates?.length || 0,
        pending:
          estimates?.filter((e: any) => e.status === 'pending').length || 0,
        approved:
          estimates?.filter((e: any) => e.status === 'approved').length || 0,
        declined:
          estimates?.filter((e: any) => e.status === 'declined').length || 0,
      };
      return NextResponse.json(stats);
    }

    return NextResponse.json(estimates || []);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return unauthorizedResponse();
  }
}

// POST /api/estimates - Create a new estimate
export async function POST(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createAuthenticatedClient(request);
    const body = await request.json();


    // Add account_id to estimate data
    const estimateData = {
      ...body,
      // account_id: context.accountId, // Uncomment when column is ready
    };

    const { data: estimate, error } = await supabase
      .from('estimates')
      .insert(estimateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating estimate:', error);
      return errorResponse(error, 'Failed to create estimate');
    }

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return unauthorizedResponse();
  }
}
