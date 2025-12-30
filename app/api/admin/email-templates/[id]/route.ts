import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// Schema for email template update validation
const updateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  subject_template: z
    .string()
    .min(1, 'Subject template is required')
    .optional(),
  body_template: z.string().min(1, 'Body template is required').optional(),
  variables: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/email-templates/[id] - Get a specific email template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Email template not found' },
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
    console.error('Error in email template GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * PUT /api/admin/email-templates/[id] - Update an email template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'PUT');

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
    const { id } = await params;

    // Validate request body
    const body = await request.json();
    const validation = updateEmailTemplateSchema.safeParse(body);

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
      .from('email_templates')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to update email template' },
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
    console.error('Error in email template PUT:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email-templates/[id] - Delete an email template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'DELETE');

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
    const { id } = await params;

    // Check if template is default (cannot delete defaults)
    perfLogger.incrementQueryCount();
    const { data: template, error: fetchError } = await supabase
      .from('email_templates')
      .select('is_default')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching email template:', fetchError);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    if (template.is_default) {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'Cannot delete default email template' },
        { status: 400 }
      );
    }

    // Delete the template
    perfLogger.incrementQueryCount();
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting email template:', deleteError);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Email template deleted successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in email template DELETE:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
