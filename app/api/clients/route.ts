import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createServerClient } from '@supabase/ssr';
import { PerformanceLogger } from '@/lib/api/performance';
import { validateRequest, createClientSchema } from '@/lib/api/validation';

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
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
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

    // Add account_id and map postal_code to zip_code
    const clientData = {
      ...validatedData,
      account_id: context.accountId,
      zip_code: validatedData.postal_code, // Map to DB field
    };
    delete (clientData as any).postal_code; // Remove the validation field

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
