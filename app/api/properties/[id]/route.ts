import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { PerformanceLogger } from '@/lib/api/performance';
import {
  validateRequest,
  updatePropertySchema,
  uuidSchema,
} from '@/lib/api/validation';
import { errorResponse } from '@/lib/api-helpers';

// GET /api/properties/[id] - Get a single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);

    const { id } = await params;

    // Validate ID
    const { data: validatedId, error: idError } = uuidSchema.safeParse(id);
    if (idError) {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    const supabaseClient = await createRouteHandlerClient();

    perfLogger.incrementQueryCount();
    const { data: property, error } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', validatedId)
      .eq('account_id', context.accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        perfLogger.complete(404);
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching property:', error);
      perfLogger.complete(500);
      return errorResponse(error, 'Failed to fetch property');
    }

    const metrics = perfLogger.complete(200);
    const response = NextResponse.json(property);
    response.headers.set('X-Response-Time', `${metrics.duration}ms`);
    if (metrics.queryCount) {
      response.headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    return response;
  } catch (error) {
    console.error('Error fetching property:', error);
    perfLogger.complete(401);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID
    const { data: validatedId, error: idError } = uuidSchema.safeParse(id);
    if (idError) {
      return NextResponse.json(
        { error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    const supabaseClient = await createRouteHandlerClient();

    // Validate request body
    const { data: validatedData, error: validationError } =
      await validateRequest(request, updatePropertySchema);
    if (validationError) return validationError;

    if (!validatedData) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { data: property, error } = await supabaseClient
      .from('properties')
      .update(validatedData)
      .eq('id', validatedId)
      .eq('account_id', context.accountId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      console.error('Error updating property:', error);
      return errorResponse(error, 'Failed to update property');
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID
    const { data: validatedId, error: idError } = uuidSchema.safeParse(id);
    if (idError) {
      return NextResponse.json(
        { error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    const supabaseClient = await createRouteHandlerClient();

    const { error } = await supabaseClient
      .from('properties')
      .delete()
      .eq('id', validatedId)
      .eq('account_id', context.accountId);

    if (error) {
      console.error('Error deleting property:', error);
      return errorResponse(error, 'Failed to delete property');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
