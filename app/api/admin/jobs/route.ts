import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards-api';
import { listJobs, createJob, type JobFilters } from '@/lib/api/jobs';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/admin/jobs - List all jobs (admin full access)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAdminContext(request);
      supabase = await createRouteHandlerClient();
    } catch (error) {
      // For demo purposes, allow access without account context
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Create a mock context for demo
      context = {
        accountId: 'demo',
        userId: 'demo-user',
        role: 'ADMIN' as const,
        permissions: [],
        user: { id: 'demo-user', email: 'demo@example.com' },
        account: { id: 'demo', name: 'Demo Account' },
      };
    }
    const { searchParams } = new URL(request.url);

    const filters: JobFilters = {
      clientId: searchParams.get('client_id') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
      assignedTechId: searchParams.get('assigned_tech_id') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      sort: searchParams.get('sort') || 'created_at',
      dir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
    };

    const { data, page, pageSize, total, error } = await listJobs(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], page, pageSize, total });
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('required') || error.message?.includes('access');
    if (!isAuthError) {
      console.error('Error in GET /api/admin/jobs:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      {
        status: isAuthError
          ? error.message?.includes('required')
            ? 401
            : 403
          : 500,
      }
    );
  }
}

/**
 * POST /api/admin/jobs - Create a new job (admin full access)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = await createRouteHandlerClient();
    const body = await request.json();

    const jobData = {
      client_id: body.client_id,
      property_id: body.property_id || null,
      title: body.title,
      description: body.description || null,
      status: body.status || 'scheduled',
      service_date: body.service_date,
      scheduled_time: body.scheduled_time || null,
      notes: body.notes || null,
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      total: body.total || 0,
      assigned_tech_id: body.assigned_tech_id || null,
      line_items: body.line_items || [],
    };

    const { data, error } = await createJob(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      jobData
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('required') || error.message?.includes('access');
    if (!isAuthError) {
      console.error('Error in POST /api/admin/jobs:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      {
        status: isAuthError
          ? error.message?.includes('required')
            ? 401
            : 403
          : 500,
      }
    );
  }
}
