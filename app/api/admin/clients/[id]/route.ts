import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { getClientById, updateClient, deleteClient } from '@/lib/api/clients';

/**
 * GET /api/admin/clients/[id] - Get a single client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    const { data, error } = await getClientById(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      id
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/admin/clients/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/admin/clients/[id] - Update a client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const body = await request.json();
    const { id } = await params;

    const { data, error } = await updateClient(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      id,
      body
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/clients/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/clients/[id] - Delete a client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    const { success, error } = await deleteClient(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      id
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/clients/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
