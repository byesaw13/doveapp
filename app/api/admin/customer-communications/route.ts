import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for customer communication validation
const customerCommunicationSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  communication_type: z.enum([
    'call',
    'email',
    'note',
    'meeting',
    'sms',
    'in_person',
    'other',
  ]),
  direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  contact_person: z.string().optional(),
  contact_method: z.string().optional(),
  occurred_at: z.string().datetime().optional(),
  duration_minutes: z.number().positive().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z
    .enum(['pending', 'completed', 'cancelled', 'failed'])
    .default('completed'),
  requires_followup: z.boolean().default(false),
  followup_date: z.string().datetime().optional(),
  followup_notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  job_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
});

/**
 * GET /api/admin/customer-communications - Get customer communications with filtering
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    const searchParams = url.searchParams;
    const customerId = searchParams.get('customer_id');
    const communicationType = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    perfLogger.incrementQueryCount();
    let query = supabase
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
          title
        ),
        invoices (
          invoice_number
        )
      `
      )
      .order('occurred_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (communicationType) {
      query = query.eq('communication_type', communicationType);
    }

    const { data: communications, error } = await query;

    if (error) {
      console.error('Error fetching customer communications:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch customer communications' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { communications: communications || [] },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer communications GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * POST /api/admin/customer-communications - Create a new customer communication
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Validate request body
    const body = await request.json();
    const validation = customerCommunicationSchema.safeParse(body);

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

    const communicationData = {
      ...validation.data,
      created_by: context.userId,
    };

    perfLogger.incrementQueryCount();
    const { data: communication, error } = await supabase
      .from('customer_communications')
      .insert(communicationData)
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
      console.error('Error creating customer communication:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to create customer communication' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(201);
    return NextResponse.json(
      { communication },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer communications POST:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
