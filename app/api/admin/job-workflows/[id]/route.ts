import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for job workflow update validation
const updateJobWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional(),
  trigger_status: z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  is_active: z.boolean().optional(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        title: z.string().optional(),
        message: z.string().optional(),
        recipients: z.array(z.string()).optional(),
        auto_generate: z.boolean().optional(),
        due_days: z.number().optional(),
        hours_before: z.number().optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/admin/job-workflows/[id] - Get a specific job workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { data: workflow, error } = await supabase
      .from('job_workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching job workflow:', error);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Job workflow not found' },
        { status: 404 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { workflow },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job workflow GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * PUT /api/admin/job-workflows/[id] - Update a job workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'PUT');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Validate request body
    const body = await request.json();
    const validation = updateJobWorkflowSchema.safeParse(body);

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
    const { data: workflow, error } = await supabase
      .from('job_workflows')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job workflow:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to update job workflow' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { workflow },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job workflow PUT:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/job-workflows/[id] - Delete a job workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'DELETE');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { error } = await supabase
      .from('job_workflows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job workflow:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to delete job workflow' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Job workflow deleted successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job workflow DELETE:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
