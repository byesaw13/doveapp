import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import {
  listClients,
  createClient,
  type ClientFilters,
} from '@/lib/api/clients';

/**
 * GET /api/admin/clients - List all clients (admin full access)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    const filters: ClientFilters = {
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      sort: searchParams.get('sort') || 'created_at',
      dir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
    };

    const { data, page, pageSize, total, error } = await listClients(
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
    console.error('Error in GET /api/admin/clients:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/admin/clients - Create a new client (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const body = await request.json();

    const { data, error } = await createClient(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      body
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/clients:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
