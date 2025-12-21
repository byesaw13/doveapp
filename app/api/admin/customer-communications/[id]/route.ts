import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';

// Schema for customer communication update validation
const updateCustomerCommunicationSchema = z.object({
  communication_type: z
    .enum(['call', 'email', 'note', 'meeting', 'sms', 'in_person', 'other'])
    .optional(),
  direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  contact_person: z.string().optional(),
  contact_method: z.string().optional(),
  occurred_at: z.string().datetime().optional(),
  duration_minutes: z.number().positive().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'failed']).optional(),
  requires_followup: z.boolean().optional(),
  followup_date: z.string().datetime().optional(),
  followup_notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});

/**
 * GET /api/admin/customer-communications/[id] - Get a specific customer communication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { data: communication, error } = await supabase
      .from('customer_communications')
      .select(
        `
        *,
        clients (
          first_name,
          last_name,
          email,
          phone
        ),
        jobs (
          id,
          title
        ),
        invoices (
          id,
          invoice_number
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer communication:', error);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Customer communication not found' },
        { status: 404 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { communication },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer communication GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * PUT /api/admin/customer-communications/[id] - Update a customer communication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'PUT');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    // Validate request body
    const body = await request.json();
    const validation = updateCustomerCommunicationSchema.safeParse(body);

    if (!validation.success) {
      perfLogger.complete(400);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    perfLogger.incrementQueryCount();
    const { data: communication, error } = await supabase
      .from('customer_communications')
      .update(validation.data)
      .eq('id', id)
      .select(
        `
        *,
        clients (
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating customer communication:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to update customer communication' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { communication },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer communication PUT:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/customer-communications/[id] - Delete a customer communication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'DELETE');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { error } = await supabase
      .from('customer_communications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer communication:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to delete customer communication' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Customer communication deleted successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer communication DELETE:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
