import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createServerClient } from '@supabase/ssr';
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

    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    let queryBuilder = supabaseClient
      .from('customers') // Updated to customers table
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by account - CRITICAL for multi-tenancy
    queryBuilder = queryBuilder.eq('account_id', context.accountId);

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`
      );
    }

    perfLogger.incrementQueryCount();
    const { data: clients, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching clients:', error);
      perfLogger.complete(500);
      return errorResponse(error, 'Failed to fetch clients');
    }

    // Map customers to clients format
    const mappedClients = clients?.map((c) => ({
      ...c,
      first_name: c.name?.split(' ')[0] || '',
      last_name: c.name?.split(' ').slice(1).join(' ') || '',
    }));

    const metrics = perfLogger.complete(200);
    const response = NextResponse.json(mappedClients || []);
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

    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

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

    // Map validation fields to customers table schema
    const clientData = {
      account_id: context.accountId,
      name: `${validatedData.first_name} ${validatedData.last_name}`.trim(),
      email: validatedData.email,
      phone: validatedData.phone,
      address_line1: validatedData.address_line1,
      address_line2: validatedData.address_line2,
      city: validatedData.city,
      state: validatedData.state,
      zip_code: validatedData.postal_code,
    };

    const { data: client, error } = await supabaseClient
      .from('customers') // Updated to customers table
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
