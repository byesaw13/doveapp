import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for job template update validation
const updateJobTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').max(100).optional(),
  estimated_duration_hours: z.number().positive().optional(),
  estimated_cost: z.number().positive().optional(),
  default_priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  template_data: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      line_items: z
        .array(
          z.object({
            item_type: z.enum(['labor', 'material']),
            description: z.string(),
            quantity: z.number().positive(),
            unit_price: z.number().positive(),
          })
        )
        .optional(),
    })
    .optional(),
  is_public: z.boolean().optional(),
});

/**
 * GET /api/admin/job-templates/[id] - Get a specific job template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication
    await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { data: template, error } = await supabase
      .from('job_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching job template:', error);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Job template not found' },
        { status: 404 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { template },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job template GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * PUT /api/admin/job-templates/[id] - Update a job template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'PUT');

  try {
    // Validate authentication
    await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Validate request body
    const body = await request.json();
    const validation = updateJobTemplateSchema.safeParse(body);

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
    const { data: template, error } = await supabase
      .from('job_templates')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job template:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to update job template' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { template },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job template PUT:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/job-templates/[id] - Delete a job template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'DELETE');

  try {
    // Validate authentication
    await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { error } = await supabase
      .from('job_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job template:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to delete job template' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Job template deleted successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job template DELETE:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
