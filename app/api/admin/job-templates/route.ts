import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for job template validation
const jobTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').max(100),
  estimated_duration_hours: z.number().positive().optional(),
  estimated_cost: z.number().positive().optional(),
  default_priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  template_data: z.object({
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
  }),
  is_public: z.boolean().default(false),
});

/**
 * GET /api/admin/job-templates - Get all job templates
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    const searchParams = url.searchParams;
    const category = searchParams.get('category');
    const includePublic = searchParams.get('include_public') === 'true';

    perfLogger.incrementQueryCount();
    let query = supabase
      .from('job_templates')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter by category if specified
    if (category) {
      query = query.eq('category', category);
    }

    // Include public templates if requested
    if (!includePublic) {
      query = query.or(`created_by.eq.${context.userId},is_public.eq.true`);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching job templates:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch job templates' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { templates: templates || [] },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job templates GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * POST /api/admin/job-templates - Create a new job template
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    // Validate authentication
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Validate request body
    const body = await request.json();
    const validation = jobTemplateSchema.safeParse(body);

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

    const templateData = {
      ...validation.data,
      created_by: context.userId,
      account_id: context.accountId,
    };

    perfLogger.incrementQueryCount();
    const { data: template, error } = await supabase
      .from('job_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating job template:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to create job template' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(201);
    return NextResponse.json(
      { template },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job templates POST:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
