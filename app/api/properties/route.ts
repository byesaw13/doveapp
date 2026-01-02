import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { PerformanceLogger } from '@/lib/api/performance';
import { validateRequest, createPropertySchema } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api-helpers';

// GET /api/properties - Get all properties or search
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);

    const supabaseClient = await createRouteHandlerClient();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const clientId = searchParams.get('client_id');

    let queryBuilder = supabaseClient
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by account - CRITICAL for multi-tenancy
    queryBuilder = queryBuilder.eq('account_id', context.accountId);

    if (clientId) {
      queryBuilder = queryBuilder.eq('client_id', clientId);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,address_line1.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,property_type.ilike.%${query}%`
      );
    }

    perfLogger.incrementQueryCount();
    const { data: properties, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching properties:', error);
      perfLogger.complete(500);
      return errorResponse(error, 'Failed to fetch properties');
    }

    const metrics = perfLogger.complete(200);
    const response = NextResponse.json(properties || []);
    response.headers.set('X-Response-Time', `${metrics.duration}ms`);
    if (metrics.queryCount) {
      response.headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    return response;
  } catch (error) {
    console.error('Error fetching properties:', error);
    perfLogger.complete(401);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabaseClient = await createRouteHandlerClient();

    // Validate request body
    const { data: validatedData, error: validationError } =
      await validateRequest(request, createPropertySchema);
    if (validationError) return validationError;

    if (!validatedData) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Prepare property data
    const propertyData = {
      ...validatedData,
      account_id: context.accountId,
    };

    const { data: property, error } = await supabaseClient
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return errorResponse(error, 'Failed to create property');
    }

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
