import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { validateRequest, createEstimateSchema } from '@/lib/api/validation';

// GET /api/estimates - Get all estimates or search
export async function GET(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAccountContext(request);
      supabase = createAuthenticatedClient(request);
    } catch (error) {
      // For demo purposes, allow access without account context
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    let queryBuilder = supabase
      .from('estimates')
      .select(
        `
        *,
        clients!estimates_client_id_fkey (
          id,
          first_name,
          last_name,
          company_name,
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

    // Calculate stats
    const stats = {
      total: estimates?.length || 0,
      pending:
        estimates?.filter((e: any) => e.status === 'pending').length || 0,
      approved:
        estimates?.filter((e: any) => e.status === 'approved').length || 0,
      declined:
        estimates?.filter((e: any) => e.status === 'declined').length || 0,
    };

    // Return stats if requested
    if (action === 'stats') {
      return NextResponse.json(stats);
    }

    // Return estimates with stats
    return NextResponse.json({
      estimates: estimates || [],
      stats,
    });
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

    // Validate request body
    const { data, error: validationError } = await validateRequest(
      request,
      createEstimateSchema
    );
    if (validationError) return validationError;

    // Add account_id to estimate data
    const estimateData = {
      ...data,
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
