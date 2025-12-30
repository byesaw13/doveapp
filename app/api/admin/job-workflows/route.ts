import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for job workflow validation
const jobWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  trigger_status: z.enum([
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  is_active: z.boolean().default(true),
  actions: z.array(
    z.object({
      type: z.string(),
      title: z.string().optional(),
      message: z.string().optional(),
      recipients: z.array(z.string()).optional(),
      auto_generate: z.boolean().optional(),
      due_days: z.number().optional(),
      hours_before: z.number().optional(),
    })
  ),
});

/**
 * GET /api/admin/job-workflows - Get all job workflows
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    const searchParams = url.searchParams;
    const triggerStatus = searchParams.get('trigger_status');
    const activeOnly = searchParams.get('active_only') !== 'false';

    perfLogger.incrementQueryCount();
    let query = supabase
      .from('job_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (triggerStatus) {
      query = query.eq('trigger_status', triggerStatus);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: workflows, error } = await query;

    if (error) {
      console.error('Error fetching job workflows:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch job workflows' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { workflows: workflows || [] },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job workflows GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * POST /api/admin/job-workflows - Create a new job workflow
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Validate request body
    const body = await request.json();
    const validation = jobWorkflowSchema.safeParse(body);

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

    const workflowData = {
      ...validation.data,
      created_by: context.userId,
    };

    perfLogger.incrementQueryCount();
    const { data: workflow, error } = await supabase
      .from('job_workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) {
      console.error('Error creating job workflow:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to create job workflow' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(201);
    return NextResponse.json(
      { workflow },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job workflows POST:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
