import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for email template validation
const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['invoice', 'estimate', 'general']),
  subject_template: z.string().min(1, 'Subject template is required'),
  body_template: z.string().min(1, 'Body template is required'),
  variables: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/email-templates - Get all email templates
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const searchParams = url.searchParams;
    const type = searchParams.get('type');

    perfLogger.incrementQueryCount();
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching email templates:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
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
    console.error('Error in email templates GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * POST /api/admin/email-templates - Create a new email template
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Validate request body
    const body = await request.json();
    const validation = emailTemplateSchema.safeParse(body);

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
    };

    perfLogger.incrementQueryCount();
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to create email template' },
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
    console.error('Error in email templates POST:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
