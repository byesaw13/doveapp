import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { PerformanceLogger } from '@/lib/api/performance';
import { validateRequest, createClientSchema } from '@/lib/api/validation';
import { errorResponse } from '@/lib/api-helpers';

// GET /api/clients - Get all clients or search
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);

    const supabaseClient = await createRouteHandlerClient();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    let queryBuilder = supabaseClient
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by account - CRITICAL for multi-tenancy
    queryBuilder = queryBuilder.eq('account_id', context.accountId);

    if (query) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`
      );
    }

    perfLogger.incrementQueryCount();
    const { data: clients, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching clients:', error);
      perfLogger.complete(500);
      return errorResponse(error, 'Failed to fetch clients');
    }

    const metrics = perfLogger.complete(200);
    const response = NextResponse.json(clients || []);
    response.headers.set('X-Response-Time', `${metrics.duration}ms`);
    if (metrics.queryCount) {
      response.headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    return response;
  } catch (error) {
    console.error('Error fetching clients:', error);
    perfLogger.complete(401);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// POST /api/clients - Create a new client
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
      await validateRequest(request, createClientSchema);
    if (validationError) return validationError;

    if (!validatedData) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Normalize name to first_name/last_name if needed
    let firstName = validatedData.first_name;
    let lastName = validatedData.last_name;
    if ((validatedData as any).name && (!firstName || !lastName)) {
      const parts = (validatedData as any).name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || 'Unknown';
    }

    // Ensure required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'first_name and last_name are required' },
        { status: 400 }
      );
    }

    // Prepare client data
    const clientData = {
      ...validatedData,
      first_name: firstName,
      last_name: lastName,
      account_id: context.accountId,
    };

    const { data: client, error } = await supabaseClient
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return errorResponse(error, 'Failed to create client');
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
